import type { Application } from 'express';
import { createApp } from '../src/app';

let appPromise: Promise<Application> | null = null;

export async function getTestApp(): Promise<Application> {
  if (!appPromise) {
    appPromise = createApp();
  }
  return appPromise;
}
