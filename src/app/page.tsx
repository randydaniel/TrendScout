'use client'

import { TrendingSearches } from '@/src/components/TrendingSearches';
import { useState } from 'react';

export default function Page() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Add your authentication logic here
    console.log('Login attempted with:', { username, password });
  };

  return (
    <main className="min-h-screen flex flex-col p-24">
      <div className="w-full max-w-4xl mx-auto">
        <TrendingSearches />
      </div>
    </main>
  );
}