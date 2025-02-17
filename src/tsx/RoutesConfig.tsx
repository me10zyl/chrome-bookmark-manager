import { Route, Routes } from 'react-router-dom';
import Popup from "./Popup";
import Search from "./search/Search";
import React from "react";
import BookmarkGroups from "./bookmarkGroup/BookmarkGroup";


export default function RoutesConfig() {
    return (
        <Routes>
            <Route path="/" element={<Popup />} />
            <Route path="/search" element={<Search />} />
            <Route path="/bookmarkGroups" element={<BookmarkGroups />} />
        </Routes>
    );
}