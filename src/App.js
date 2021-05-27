import React, {useState} from 'react';
import {Box, Grid, useColorModeValue,} from '@chakra-ui/react';
import {ColorModeSwitcher} from './ColorModeSwitcher';
import Router from "./components/router";
import {useAsyncMemo} from "use-async-memo";
import {getHub, getMetamask} from "./components/utils";
import {createNotification} from "./components/notification";
import {ErrorBoundary} from "react-error-boundary";
import ErrorFallback from "./components/error";

export const IdentityContext = React.createContext(null)
export const MetamaskContext = React.createContext(null)
export const HubContext = React.createContext(null)
export const UserContext = React.createContext(null)
export const GAME_THREAD = "bafk65mkygxw5aqoxwkbhcktv4yjlyegc376w5ertwfihjftj74t5afa"
export const API_URL = /*"https://cryptomafias-api.herokuapp.com" ||*/ "http://localhost:5000"

function App() {
    const [identity, setIdentity] = useState(null)
    const [user, setUser] = useState(null)
    const metamask = useAsyncMemo(async () => {
        try {
            return await getMetamask()
        } catch (err) {
            createNotification("error", err.name, err.message)
        }
    }, [], {})
    const hub = useAsyncMemo(async () => {
        try {
            return await getHub(identity)
        } catch (err) {
            createNotification("error", err.name, err.message)
        }
    }, [identity], {})

    return (
        <Box textAlign="center" fontSize="xl" bg={useColorModeValue('gray.50', 'gray.800')}>
            <Grid minH="100vh" p={3}>
                <ColorModeSwitcher justifySelf="flex-end"/>
                <IdentityContext.Provider value={{identity, setIdentity}}>
                    <MetamaskContext.Provider value={metamask}>
                        <HubContext.Provider value={hub}>
                            <UserContext.Provider value={{user, setUser}}>
                                <ErrorBoundary FallbackComponent={ErrorFallback}>
                                    <Router/>
                                </ErrorBoundary>
                            </UserContext.Provider>
                        </HubContext.Provider>
                    </MetamaskContext.Provider>
                </IdentityContext.Provider>
            </Grid>
        </Box>
    );
}

export default App;
