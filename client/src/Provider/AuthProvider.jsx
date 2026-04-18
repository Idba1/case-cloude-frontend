import { createContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import {
    GoogleAuthProvider,
    createUserWithEmailAndPassword,
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updateProfile,
} from 'firebase/auth'
import { app } from '../firebase/firebase.config'
import { ADMIN_SESSION_KEY } from '../constants/roles'

export const AuthContext = createContext(null)
const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider()

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState()
    const [appUser, setAppUser] = useState(null)
    const [loading, setLoading] = useState(true)

    const loginAsStaticAdmin = () => {
        const adminProfile = {
            name: 'CaseCloud Admin',
            email: import.meta.env.VITE_ADMIN_EMAIL,
            photo: '',
            role: 'admin',
            approvalStatus: 'approved',
        }

        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(adminProfile))
        setUser({
            displayName: adminProfile.name,
            email: adminProfile.email,
            photoURL: '',
        })
        setAppUser(adminProfile)
        setLoading(false)
    }

    const syncUserProfile = async (profile) => {
        const response = await fetch('http://localhost:5000/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profile),
        })

        if (!response.ok) {
            throw new Error('Failed to sync user profile')
        }
    }

    const loadUserProfile = async email => {
        const response = await fetch(`http://localhost:5000/users/${email}`)

        if (!response.ok) {
            throw new Error('Failed to load user profile')
        }

        return response.json()
    }

    const createUser = (email, password) => {
        setLoading(true)
        return createUserWithEmailAndPassword(auth, email, password)
    }

    const signIn = (email, password) => {
        setLoading(true)
        return signInWithEmailAndPassword(auth, email, password)
    }

    const signInWithGoogle = () => {
        setLoading(true)
        return signInWithPopup(auth, googleProvider)
    }

    const logOut = async () => {
        setLoading(true)
        localStorage.removeItem(ADMIN_SESSION_KEY)

        if (!auth.currentUser) {
            setUser(null)
            setAppUser(null)
            setLoading(false)
            return Promise.resolve()
        }

        return signOut(auth)
    }

    const updateUserProfile = (name, photo) => {
        return updateProfile(auth.currentUser, {
            displayName: name,
            photoURL: photo,
        })
    }

    // onAuthStateChange
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async currentUser => {
            setUser(currentUser)

            if (!currentUser?.email) {
                const storedAdminSession = localStorage.getItem(ADMIN_SESSION_KEY)

                if (storedAdminSession) {
                    const parsedAdmin = JSON.parse(storedAdminSession)
                    setUser({
                        displayName: parsedAdmin.name,
                        email: parsedAdmin.email,
                        photoURL: parsedAdmin.photo || '',
                    })
                    setAppUser(parsedAdmin)
                    setLoading(false)
                    return
                }

                setAppUser(null)
                setLoading(false)
                return
            }

            try {
                const existingProfile = await loadUserProfile(currentUser.email)

                if (existingProfile) {
                    setAppUser(existingProfile)
                } else {
                    const fallbackProfile = {
                        name: currentUser.displayName || 'CaseCloud User',
                        email: currentUser.email,
                        photo: currentUser.photoURL || '',
                        role: 'client',
                        approvalStatus: 'approved',
                    }

                    await syncUserProfile(fallbackProfile)
                    setAppUser(fallbackProfile)
                }
            } catch (error) {
                console.log(error)
                setAppUser({
                    name: currentUser.displayName || 'CaseCloud User',
                    email: currentUser.email,
                    photo: currentUser.photoURL || '',
                    role: 'client',
                    approvalStatus: 'approved',
                })
            } finally {
                setLoading(false)
            }
            console.log('CurrentUser-->', currentUser)
        })
        return () => {
            return unsubscribe()
        }
    }, [])

    const authInfo = {
        user,
        setUser,
        appUser,
        setAppUser,
        loading,
        setLoading,
        createUser,
        signIn,
        signInWithGoogle,
        logOut,
        loginAsStaticAdmin,
        updateUserProfile,
        syncUserProfile,
        loadUserProfile,
    }

    return (
        <AuthContext.Provider value={authInfo}>{children}</AuthContext.Provider>
    )
}

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
}

export default AuthProvider
