import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      // Appwrite account recovery would go here
      // await account.createRecovery(email, window.location.origin + '/reset-password');
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim email reset.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8 text-center">
            <CheckCircle className="size-16 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900">Email Terkirim!</h3>
            <p className="text-slate-500 mt-2">Cek inbox email Anda untuk instruksi reset password.</p>
            <Button className="mt-6" onClick={() => navigate('/login')}>Kembali ke Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Lupa Password</CardTitle>
          <CardDescription>Masukkan email untuk mereset password Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-200">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative"><Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><Input id="email" type="email" className="pl-9" value={email} onChange={e => setEmail(e.target.value)} required /></div>
            </div>
            <Button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800" disabled={isLoading}>{isLoading ? 'Mengirim...' : 'Kirim Link Reset'}</Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t pt-6">
          <Button variant="link" onClick={() => navigate('/login')} className="text-sm"><ArrowLeft className="size-4 mr-1" />Kembali ke Login</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
