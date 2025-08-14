import { NextRequest, NextResponse } from 'next/server';
import { Client, Users, Query } from 'node-appwrite';

// Initialize server client for user lookup
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const users = new Users(client);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, email, userIds } = body;

    switch (action) {
      case 'findUserByEmail':
        if (!email) {
          return NextResponse.json(
            { error: 'Email is required' },
            { status: 400 }
          );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          return NextResponse.json(
            { error: 'Please provide a valid email address' },
            { status: 400 }
          );
        }

        // Find user by email
        const userToAdd = await findUserByEmail(email.trim());
        if (!userToAdd) {
          console.log(`User lookup failed for email: ${email.trim()}`);
          return NextResponse.json(
            { error: 'No user found with this email address. The user must have an account to be added to the project.' },
            { status: 404 }
          );
        }

        console.log(`Successfully found user: ${userToAdd.name} (${userToAdd.email})`);

        return NextResponse.json({
          success: true,
          user: {
            id: userToAdd.$id,
            name: userToAdd.name,
            email: userToAdd.email
          }
        });

      case 'getUserDetails':
        if (!userIds || !Array.isArray(userIds)) {
          return NextResponse.json(
            { error: 'User IDs array is required' },
            { status: 400 }
          );
        }

        // Get user details for multiple users
        const userDetails = await Promise.all(
          userIds.map(async (userId: string) => {
            try {
              const user = await users.get(userId);
              return {
                id: user.$id,
                name: user.name,
                email: user.email
              };
            } catch (error) {
              console.error(`Failed to get user details for ${userId}:`, error);
              return {
                id: userId,
                name: 'Unknown User',
                email: 'unknown@example.com'
              };
            }
          })
        );

        return NextResponse.json({
          success: true,
          users: userDetails
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Project API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to find user by email
async function findUserByEmail(email: string) {
  try {
    console.log(`Searching for user with email: ${email}`);

    // Use the correct Appwrite query syntax for searching users by email
    const usersList = await users.list([
      Query.equal('email', email)
    ]);

    console.log(`Found ${usersList.users.length} users with email: ${email}`);
    return usersList.users.length > 0 ? usersList.users[0] : null;
  } catch (error) {
    console.error('Error finding user by email:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return null;
  }
}
