import { cookies } from 'next/headers';

export default async function getToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;

  if (!token) {
    return "dummy";
  }

  return token;
} 