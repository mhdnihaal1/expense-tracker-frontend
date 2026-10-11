import { router } from 'expo-router';

// Modals can be opened directly by URL (web refresh, deep link) with no history to pop.
export function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}
