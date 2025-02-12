import {StrictMode} from "react";
import {createRoot} from 'react-dom/client'
import App from "./App";
import React from 'react';
let elementId = 'cbm-content-script-react';
let ele = document.getElementById(elementId);
if(!ele) {
    let div = document.createElement('div');
    div.id = elementId
    document.body.appendChild(div)
    createRoot(div).render(
        <StrictMode>
            <App/>
        </StrictMode>,
    )
}