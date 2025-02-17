import { HashRouter as Router } from 'react-router-dom';
import RoutesConfig from './RoutesConfig';
import React from "react";
import {SearchResultsProvider} from "./search/SearchResultsContext";

export default function App() {
    return (
        <Router>
            <RoutesConfig />
        </Router>
    );
}