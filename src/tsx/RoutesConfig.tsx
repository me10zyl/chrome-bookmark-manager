import { Route, Routes } from 'react-router-dom';
import Popup from "./Popup";
import Search from "./Search";


export default function RoutesConfig() {
    return (
        <Routes>
            <Route path="/" element={<Popup />} />
            <Route path="/search" element={<Search />} />
        </Routes>
    );
}