import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// O jsdom usado pelo react-scripts 5 não traz TextEncoder/TextDecoder
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}