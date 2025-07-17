import React, { useState } from 'react';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  if (user) {
    return (
      <div className="p-4 bg-white rounded shadow flex flex-col gap-2">
        <span className="text-green-600">Signed in as {user.email}</span>
        <button className="bg-red-500 text-white px-4 py-2 rounded" onClick={handleSignOut}>Sign Out</button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">{isRegister ? 'Register' : 'Sign In'}</h2>
      <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
        <input
          className="border p-2 rounded"
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          className="border p-2 rounded"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {error && <span className="text-red-500">{error}</span>}
        <button className="bg-blue-500 text-white px-4 py-2 rounded" type="submit">
          {isRegister ? 'Register' : 'Sign In'}
        </button>
      </form>
      <button
        className="mt-2 text-blue-500 underline"
        onClick={() => setIsRegister(r => !r)}
      >
        {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
      </button>
    </div>
  );
};

export default Auth;
