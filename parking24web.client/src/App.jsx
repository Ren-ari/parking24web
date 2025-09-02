import './index.css';
import PLCControl from './components/PLCControl';
import './App.css';


document.body.style.fontFamily = "'Noto Sans KR', sans-serif";

function App() {
    return (
        <div className="App">
            <PLCControl />
        </div>
    );
}
export default App;