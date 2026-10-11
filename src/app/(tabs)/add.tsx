import { Redirect } from 'expo-router';

// Placeholder route for the center "+" tab; its button opens /transaction/new instead.
export default function AddPlaceholder() {
  return <Redirect href="/transaction/new" />;
}
