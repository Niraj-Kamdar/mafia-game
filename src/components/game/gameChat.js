import {
    Box,
    FormControl,
    Input,
    InputGroup,
    InputRightAddon,
    Stack,
    Text,
    useColorModeValue,
    VStack
} from '@chakra-ui/react';
import React, {useCallback, useContext, useEffect, useState} from "react";
import {API_URL, HubContext, IdentityContext} from "../../App";
import {Field, Form, Formik} from "formik";
import * as yup from "yup";
// import {PrivateKey} from "@textile/hub";
// import {PolyAES} from "poly-crypto";
import axios from "axios";

const initialState = {
    message: ""
}

const schema = yup.object().shape({
    message: yup.string().required("Message can't be empty!")
});


function Message({notification}) {
    const notificationColor = useColorModeValue('red', 'tomato')
    if (notification.type === "CHAT") {
        return (
            <Text fontSize={"md"}>{notification.Notification}</Text>
        )
    } else if (notification.type === "SYSTEM") {
        return (
            <Text color={notificationColor} fontSize={"md"}>Notification: {notification.Notification}</Text>
        )
    }
    return null
}


function GameChat({room, threads, setThreads, setPlayerToRole}) {
    const hub = useContext(HubContext)
    const {identity} = useContext(IdentityContext)
    const [messages, setMessages] = useState([])
    const [messageIdExists, setMessageIdExists] = useState(new Set())
    const BoxBG = useColorModeValue('gray.200', 'gray.600')

    const sendMessage = async (values, {setSubmitting, resetForm}) => {
        const message = {
            subject: "",
            message: values.message,
            to: "ALL",
            from: identity.public.toString(),
            type: "CHAT"
        }
        await hub.client.create(threads.villagerThread, "chat", [message])
        setSubmitting(false)
        resetForm()
    }

    const messageParser = useCallback(async (message) => {
        if (message.type === "CHAT" && message.to === "ALL") {
            const playerIdx = room.players.indexOf(message.from)
            console.log(`${playerIdx + 1}: ${message.message}`)
            return {Notification: `${playerIdx + 1}: ${message.message}`, type: "CHAT", _id: message._id}
        } else if (message.type === "SYSTEM" && message.to === "ALL") {
            let notification
            const playerIdx = message.message === "none" ? "none" : room.players.indexOf(message.from)
            if (message.subject === "DEAD_PLAYER") {
                notification = `${playerIdx} has been killed during night!`
            } else if (message.subject === "EJECTED_PLAYER") {
                notification = `${playerIdx} has been voted out!`
            }
            return {Notification: notification, type: "SYSTEM", _id: message._id}
        } else if (message.type === "SYSTEM" && message.to === identity.public.toString()) {
            if (message.subject === "RoleAssignment") {
                const roleInfo = await axios.get(`${API_URL}/rooms/${room._id}/getRole?playerId=${identity.toString()}`)
                const role = roleInfo.role
                // console.log(data)
                // const privKey = PrivateKey.fromString(identity.toString())
                // const hexKey = await privKey.decrypt(Buffer.from(data.encryptedHexKey))
                // console.log(Buffer.from(hexKey).toString())
                // const role = PolyAES.withKey(Buffer.from(hexKey).toString()).decrypt(data.encryptedRole)
                // console.log(role)
                setPlayerToRole(playerToRole => {
                    playerToRole[identity.public.toString()] = role
                    return playerToRole
                })
                if(role === "MAFIA"){
                    setThreads(threads => {
                        threads.mafiaThread = roleInfo.mafiaThread
                        return threads
                    })
                }
                return {Notification: `Your role is ${role}`, type: "SYSTEM", _id: message._id}
            }
        }
    }, [setPlayerToRole, identity, setThreads, room])

    const receiveMessage = useCallback(async (update) => {
        console.log(update)
        if (!update) {
            // fetch();
            return;
        } // hack for undefined callback
        if (update.collectionName !== "chat") return
        if (update.action === "CREATE") {
            if(messageIdExists.has(update.instance._id)) return
            setMessageIdExists((mapping) => {
                mapping.add(update.instance._id)
                return mapping
            })
            const notification = await messageParser(update.instance)
            setMessages((messages) => ([...messages, notification]))
        }
    }, [setMessages, setMessageIdExists, messageIdExists, messageParser])

    useEffect(() => {
        let subMessage
        const fetch = async () => {
            console.log("fetching")
            if (hub && hub.hasOwnProperty("client") && threads && threads.hasOwnProperty("villagerThread")) {
                console.log("chats loading")
                const rawMessages = await hub.client.find(threads.villagerThread, 'chat', {})
                const initMessages = await Promise.all(rawMessages.map(message => messageParser(message)))
                setMessages(initMessages)
                console.log(initMessages)
                subMessage = await hub.client.listen(threads.villagerThread, [{
                        collectionName: "chat"
                    }],
                    receiveMessage
                )
            }
        }
        fetch()
        return (setTimeout(() => {
            if (subMessage) {
                subMessage.close()
            }
        }), 10000)
    }, [hub, threads, messageParser, receiveMessage])

    return (
        <VStack spacing={2}>
            <Box
                w="650px"
                h="170px"
                rounded="5px"
                overflow="hidden"
                boxShadow="md"
                bg={BoxBG}
                align="left"
                pl={2}
                overflowY='scroll'
            >
                {
                    messages.map(notification => (
                        notification && <Message key={notification._id} notification={notification}/>
                    ))
                }
            </Box>
            <Formik initialValues={initialState} onSubmit={sendMessage} validationSchema={schema}>
                {(props) => (
                    <Form>
                        <Stack spacing={4} w="650px">
                            <Field name="message">
                                {({field, form}) => (
                                    <FormControl isInvalid={form.errors.message && form.touched.message}>
                                        <InputGroup width='full'>
                                            <Input {...field} id={"message"} bg={BoxBG}/>
                                            <InputRightAddon as='button' children='send' type="submit"
                                                             disabled={props.isSubmitting}/>
                                        </InputGroup>
                                    </FormControl>
                                )}
                            </Field>
                        </Stack>
                    </Form>
                )}
            </Formik>
        </VStack>
    )
}

export default GameChat
