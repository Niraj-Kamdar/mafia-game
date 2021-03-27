import React, {useState} from 'react';
import {Box, Grid, useColorModeValue,} from '@chakra-ui/react';
import {ColorModeSwitcher} from './ColorModeSwitcher';
import Router from "./components/router";

export const UserContext = React.createContext(null)

function App() {
    const [identity, setIdentity] = useState(null)
    return (
        <Box textAlign="center" fontSize="xl" bg={useColorModeValue('gray.50', 'gray.800')}>
            <Grid minH="100vh" p={3}>
                <ColorModeSwitcher justifySelf="flex-end"/>
                <UserContext.Provider value={{identity, setIdentity}}>
                    <Router/>
                </UserContext.Provider>
            </Grid>
        </Box>
    );
}

export default App;
