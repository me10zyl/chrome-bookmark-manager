import {createRoot} from "react-dom/client";
import React, {StrictMode} from "react";
import App from './App'

let ele = document.getElementById('root');
if(ele) {
    createRoot(ele).render(
        <StrictMode>
            <App/>
        </StrictMode>,
    )
}