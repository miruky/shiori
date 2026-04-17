import './style.css';
import { mountApp } from './app';

const root = document.getElementById('app');
if (root !== null) {
  mountApp(root, localStorage);
}
