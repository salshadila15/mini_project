import ReactDomServer from 'react-dom/server';
import App from './App';

export default function render() {
    return ReactDomServer.renderToString(<App />);
}
