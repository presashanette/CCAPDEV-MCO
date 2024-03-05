import Popup from './component/Popup.js';
import { useState } from 'react';

function App() {
  const [buttonPopup, setButtonPopup] = useState(false);
  return (
    <div className="App">
      <main>
        <h1>Popups</h1><br/><br/>
        <button onClick={() => setButtonPopup(true)}>Open popup</button>
      </main>

      <Popup trigger={buttonPopup} setTrigger={setButtonPopup}>
          <h3>my popup</h3>
        </Popup>
    </div>
  );
}

export default App;
