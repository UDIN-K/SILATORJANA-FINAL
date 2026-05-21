import { Client, Databases, Account } from 'appwrite';

export const client = new Client();

client
  .setEndpoint('https://sgp.cloud.appwrite.io/v1')
  .setProject('69fd6737000dbdd02a67');

export const account = new Account(client);
export const databases = new Databases(client);

// Default DB ID: '69fd691800237a6aaa72'
export const APPWRITE_DB_ID = '69fd691800237a6aaa72';
