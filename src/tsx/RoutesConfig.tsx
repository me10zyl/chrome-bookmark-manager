import { Route, Routes } from 'react-router-dom';
import Popup from "./Popup";


export default function RoutesConfig() {
    return (
        <Routes>
            <Route path="/" element={<Popup />} />
        </Routes>
    );
}