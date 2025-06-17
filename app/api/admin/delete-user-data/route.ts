import { NextRequest, NextResponse } from 'next/server';
import { Client, Databases, Query } from 'node-appwrite';

// Initialize server client
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const databases = new Databases(client);

export async function POST(req: NextRequest) {
  try {
    const { adminKey, action, userId, email } = await req.json();
    
    // Verify admin access
    if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

    switch (action) {
      case 'deleteUserData':
        if (!userId && !email) {
          return NextResponse.json(
            { error: 'User ID or email is required' },
            { status: 400 }
          );
        }

        let targetUserId = userId;
        
        // If email provided, find user ID
        if (email && !userId) {
          const users = new (await import('node-appwrite')).Users(client);
          try {
            const userList = await users.list([Query.equal('email', email)]);
            if (userList.users.length === 0) {
              return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
              );
            }
            targetUserId = userList.users[0].$id;
          } catch (error) {
            return NextResponse.json(
              { error: 'Failed to find user' },
              { status: 500 }
            );
          }
        }

        const deletionResult = await deleteAllUserData(targetUserId, databaseId);
        
        return NextResponse.json({
          success: true,
          message: `Deleted user data for ${targetUserId}`,
          details: deletionResult
        });

      case 'deleteAllData':
        const allDataResult = await deleteAllDatabaseData(databaseId);
        
        return NextResponse.json({
          success: true,
          message: 'Deleted all database data (except user accounts)',
          details: allDataResult
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in admin delete user data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function deleteAllUserData(userId: string, databaseId: string) {
  const results = {
    threads: 0,
    messages: 0,
    summaries: 0,
    projects: 0,
    errors: [] as string[]
  };

  try {
    // Delete all threads for the user
    const threadsResponse = await databases.listDocuments(
      databaseId,
      'threads',
      [Query.equal('userId', userId)]
    );
    
    for (const thread of threadsResponse.documents) {
      try {
        await databases.deleteDocument(databaseId, 'threads', thread.$id);
        results.threads++;
      } catch (error) {
        results.errors.push(`Failed to delete thread ${thread.$id}: ${error}`);
      }
    }

    // Delete all messages for the user
    const messagesResponse = await databases.listDocuments(
      databaseId,
      'messages',
      [Query.equal('userId', userId)]
    );
    
    for (const message of messagesResponse.documents) {
      try {
        await databases.deleteDocument(databaseId, 'messages', message.$id);
        results.messages++;
      } catch (error) {
        results.errors.push(`Failed to delete message ${message.$id}: ${error}`);
      }
    }

    // Delete all message summaries for the user
    try {
      const summariesResponse = await databases.listDocuments(
        databaseId,
        'message_summaries',
        [Query.equal('userId', userId)]
      );
      
      for (const summary of summariesResponse.documents) {
        try {
          await databases.deleteDocument(databaseId, 'message_summaries', summary.$id);
          results.summaries++;
        } catch (error) {
          results.errors.push(`Failed to delete summary ${summary.$id}: ${error}`);
        }
      }
    } catch (error) {
      results.errors.push(`Failed to fetch summaries: ${error}`);
    }

    // Delete all projects for the user
    try {
      const projectsResponse = await databases.listDocuments(
        databaseId,
        'projects',
        [Query.equal('userId', userId)]
      );
      
      for (const project of projectsResponse.documents) {
        try {
          await databases.deleteDocument(databaseId, 'projects', project.$id);
          results.projects++;
        } catch (error) {
          results.errors.push(`Failed to delete project ${project.$id}: ${error}`);
        }
      }
    } catch (error) {
      results.errors.push(`Failed to fetch projects: ${error}`);
    }

  } catch (error) {
    results.errors.push(`General error: ${error}`);
  }

  return results;
}

async function deleteAllDatabaseData(databaseId: string) {
  const results = {
    threads: 0,
    messages: 0,
    summaries: 0,
    projects: 0,
    errors: [] as string[]
  };

  const collections = ['threads', 'messages', 'message_summaries', 'projects'];

  for (const collectionId of collections) {
    try {
      let hasMore = true;
      while (hasMore) {
        const response = await databases.listDocuments(databaseId, collectionId, [Query.limit(100)]);
        
        if (response.documents.length === 0) {
          hasMore = false;
          continue;
        }

        for (const doc of response.documents) {
          try {
            await databases.deleteDocument(databaseId, collectionId, doc.$id);
            results[collectionId as keyof typeof results]++;
          } catch (error) {
            results.errors.push(`Failed to delete ${collectionId} ${doc.$id}: ${error}`);
          }
        }

        hasMore = response.documents.length === 100;
      }
    } catch (error) {
      results.errors.push(`Failed to process collection ${collectionId}: ${error}`);
    }
  }

  return results;
}
