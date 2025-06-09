/**
 * ApiKeyConfigForm Component
 *
 * Used in: frontend/routes/ChatHomePage.tsx, frontend/routes/SettingsPage.tsx
 * Purpose: Provides a form interface for users to configure API keys for different AI providers
 * (Google, OpenRouter, OpenAI). Displays when user hasn't configured required API keys yet.
 * Handles validation, storage, and provides links to get API keys from each provider.
 */

import React, { useCallback, useEffect } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FieldError, useForm, UseFormRegister } from 'react-hook-form';

import { Button } from '@/frontend/components/ui/button';
import { Input } from '@/frontend/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/frontend/components/ui/card';
import { Key } from 'lucide-react';
import { toast } from 'sonner';
import { useAPIKeyStore } from '@/frontend/stores/ApiKeyStore';
import { Badge } from './ui/badge';

const formSchema = z.object({
  google: z.string().trim().min(1, {
    message: 'Google API key is required for Title Generation',
  }),
  openrouter: z.string().trim().optional(),
  openai: z.string().trim().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ApiKeyConfigForm() {
  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg border-border/50">
      <CardHeader className="text-center pb-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="p-2 rounded-full bg-primary/10">
            <Key className="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardTitle className="text-xl sm:text-2xl font-bold">
          API Configuration
        </CardTitle>
        <CardDescription className="text-base text-muted-foreground">
          Securely stored in your browser's local storage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8 px-6 pb-8">
        <Form />
      </CardContent>
    </Card>
  );
}

const Form = () => {
  const { keys, setKeys } = useAPIKeyStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: keys,
  });

  useEffect(() => {
    reset(keys);
  }, [keys, reset]);

  const onSubmit = useCallback(
    (values: FormValues) => {
      setKeys(values);
      toast.success('API keys saved successfully');
    },
    [setKeys]
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="space-y-6">
        <ApiKeyField
          id="google"
          label="Google API Key"
          models={['Gemini 2.5 Flash', 'Gemini 2.5 Pro']}
          linkUrl="https://aistudio.google.com/apikey"
          placeholder="AIza..."
          register={register}
          error={errors.google}
          required
        />

        <ApiKeyField
          id="openrouter"
          label="OpenRouter API Key"
          models={['DeepSeek R1 0538', 'DeepSeek-V3']}
          linkUrl="https://openrouter.ai/settings/keys"
          placeholder="sk-or-..."
          register={register}
          error={errors.openrouter}
        />

        <ApiKeyField
          id="openai"
          label="OpenAI API Key"
          models={['GPT-4o', 'GPT-4.1-mini']}
          linkUrl="https://platform.openai.com/settings/organization/api-keys"
          placeholder="sk-..."
          register={register}
          error={errors.openai}
        />
      </div>

      <Button
        type="submit"
        className="w-full h-12 text-base font-medium focus-enhanced"
        disabled={!isDirty}
      >
        Save API Keys
      </Button>
    </form>
  );
};

interface ApiKeyFieldProps {
  id: string;
  label: string;
  linkUrl: string;
  models: string[];
  placeholder: string;
  error?: FieldError | undefined;
  required?: boolean;
  register: UseFormRegister<FormValues>;
}

const ApiKeyField = ({
  id,
  label,
  linkUrl,
  placeholder,
  models,
  error,
  required,
  register,
}: ApiKeyFieldProps) => (
  <div className="space-y-4 p-4 rounded-lg border border-border/50 bg-card/50 hover:bg-card/80 transition-colors">
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
      >
        <span>{label}</span>
        {required && (
          <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
            Required
          </span>
        )}
      </label>

      <div className="flex flex-wrap gap-2">
        {models.map((model) => (
          <Badge key={model} variant="outline" className="text-xs">
            {model}
          </Badge>
        ))}
      </div>
    </div>

    <Input
      id={id}
      placeholder={placeholder}
      {...register(id as keyof FormValues)}
      className={`h-11 focus-enhanced ${error ? 'border-destructive focus:ring-destructive' : ''}`}
    />

    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <a
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-primary hover:text-primary/80 underline underline-offset-4 transition-colors w-fit"
      >
        Get {label.split(' ')[0]} API Key →
      </a>

      {error && (
        <p className="text-sm font-medium text-destructive">{error.message}</p>
      )}
    </div>
  </div>
);
