// Ultra-minimal entry point - NO environment variables
import 'react-native-get-random-values';
import { registerRootComponent } from 'expo';
import App from './App';

// Register the main component - NO environment processing
registerRootComponent(App);
