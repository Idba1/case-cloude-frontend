import { createBrowserRouter } from "react-router-dom";
import Main from "../Layout/Main";
import ErrorPage from "../Pages/ErrorPage/ErrorPage";
import Registration from "../Pages/Authentication/Register";
import Login from "../Pages/Authentication/LogIn";
import Cases from "../Components/case/Cases";
import AddCase from "../Components/case/AddCase";
import CaseDetails from "../Components/case/CaseDetails";


const Routes = createBrowserRouter([
    {
        path: '/',
        element: <Main></Main>,
        errorElement: <ErrorPage></ErrorPage>,
        children: [
            {
                path: '/',
                element: <Cases></Cases>,
            },
            {
                path: '/add-case',
                element: <AddCase></AddCase>,
            },
            {
                path: '/case/:id',
                element: <CaseDetails></CaseDetails>,
            },
            {
                path: '/registration',
                element: <Registration></Registration>,
            },
            {
                path: '/login',
                element: <Login></Login>,
            },
        ]
    }
]);

export default Routes;