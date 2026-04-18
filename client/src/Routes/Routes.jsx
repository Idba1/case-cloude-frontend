import { createBrowserRouter } from "react-router-dom";
import Main from "../Layout/Main";
import ErrorPage from "../Pages/ErrorPage/ErrorPage";
import Registration from "../Pages/Authentication/Register";
import Login from "../Pages/Authentication/LogIn";
import Home from "../Pages/Home/Home";
import About from "../Pages/Marketing/About";
import Features from "../Pages/Marketing/Features";
import Faq from "../Pages/Marketing/Faq";
import Contact from "../Pages/Marketing/Contact";
import AdminUsers from "../Pages/Admin/AdminUsers";
import Cases from "../Components/case/Cases";
import AddCase from "../Components/case/AddCase";
import CaseDetails from "../Components/case/CaseDetails";
import EditCase from "../Components/case/EditCase";


const Routes = createBrowserRouter([
    {
        path: '/',
        element: <Main></Main>,
        errorElement: <ErrorPage></ErrorPage>,
        children: [
            {
                path: '/',
                element: <Home></Home>,
            },
            {
                path: '/cases',
                element: <Cases></Cases>,
            },
            {
                path: '/about',
                element: <About></About>,
            },
            {
                path: '/features',
                element: <Features></Features>,
            },
            {
                path: '/faq',
                element: <Faq></Faq>,
            },
            {
                path: '/contact',
                element: <Contact></Contact>,
            },
            {
                path: '/admin/users',
                element: <AdminUsers></AdminUsers>,
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
                path: '/case/:id/edit',
                element: <EditCase></EditCase>,
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
