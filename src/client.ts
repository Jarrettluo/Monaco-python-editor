/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import {listen, MessageConnection} from "vscode-ws-jsonrpc"
import {
    MonacoLanguageClient,
    CloseAction,
    ErrorAction,
    MonacoServices,
    createConnection
} from "monaco-languageclient"


const ReconnectingWebSocket = require("reconnecting-websocket")

const normalizeUrl = require("normalize-url")


// register Monaco languages
monaco.languages.register({
    id: "python",
    extensions: [".py", ".pyc", ".pyw", "pyo", "pyd"],
    aliases: ["python", "py"]
})



// create Monaco editor
const value = `# author by ljr ws`
const editor = monaco.editor.create(document.getElementById("container")!,{
    model: monaco.editor.createModel(
        value,
        "python",
        monaco.Uri.parse("inmemory://model.py")
    ),
    glyphMargin: true,
    lightbulb: {
        enabled: true
    }
})
// install Monaco language client services
MonacoServices.install(editor)

// create the web socket
const url = createUrl("/python")
const webSocket = createWebSocket(url)
// listen when the web socket is opened
listen({
    webSocket,
    onConnection: connection => {
        // create and start the language client
        const languageClient = createLanguageClient(connection)
        const disposable = languageClient.start()
        connection.onClose(() => disposable.dispose())
    }
})

function createLanguageClient(
    connection: MessageConnection
): MonacoLanguageClient {
    return new MonacoLanguageClient({
        name: "Python Language Client",
        clientOptions: {
            // use a language id as a document selector
            documentSelector: ["python"],
            // disable the default error handler
            errorHandler: {
                error: () => ErrorAction.Continue,
                closed: () => CloseAction.DoNotRestart
            }
        },
        // create a language client connection from the JSON RPC connection on demand
        connectionProvider: {
            get: (errorHandler, closeHandler) => {
                return Promise.resolve(
                    createConnection(connection, errorHandler, closeHandler)
                )
            }
        }
    })
}

function createUrl(path: string): string {
    const protocol = location.protocol === "https:" ? "wss" : "ws"
    return normalizeUrl(`${protocol}://127.0.0.1:3001${location.pathname}${path}`)
}

function createWebSocket(url: string): WebSocket {
    const socketOptions = {
        maxReconnectionDelay: 10000,
        minReconnectionDelay: 1000,
        reconnectionDelayGrowFactor: 1.3,
        connectionTimeout: 10000,
        maxRetries: Infinity,
        debug: false
    }
    return new ReconnectingWebSocket(url, undefined, socketOptions)
}

/* iframe message from parent page -- react app,vue app, etc */
window.addEventListener("message", function (event: MessageEvent) {
    console.log("事件：")
    console.log(event)
    if (event.data === "UPDATE-CODE") {
        //parent.postMessage(editor.getModel().getValue(), "*")
    }
    if (event.data === "INIT-AUTOSAVE") {
        initAutoSave()
    }
    if (event.data === "STOP-AUTOSAVE") {
        stopAutoSave()
    }
})


const textAreaDom = document.getElementById("txt-area")!
window.fetch('http://127.0.0.1:3001/code/')
    .then(res => res.text())
    .then(res => editor.setValue(res))
    .catch(err => textAreaDom.innerHTML =err);

const saveBtn = document.getElementById("saveCode")!
saveBtn.addEventListener("click", function () {
    saveCode(editor.getModel().getValue())
})

const runBtn = document.getElementById("runCode")!
runBtn.addEventListener("click", function () {
    runCode(editor.getModel().getValue())
})

const createBtn = document.getElementById("createCode")!
createBtn.addEventListener("click", function () {
    createCode(editor.getModel().getValue())
})

function createCode(value: string) {
    const textAreaDom = document.getElementById("txt-area")!
    window.fetch('http://127.0.0.1:3001/code/',{
        method:'POST',
        body:value
    })
        .then(res => res.text())
        .then(res => textAreaDom.innerHTML = res)
        .catch(err => textAreaDom.innerHTML =err);
}

function saveCode(value: string) {
    const textAreaDom = document.getElementById("txt-area")!
    window.fetch('http://127.0.0.1:3001/code/',{
        method:'POST',
        body:value
    })
        .then(res => res.text())
        .then(res => textAreaDom.innerHTML = res)
        .catch(err => textAreaDom.innerHTML =err);
}

function runCode(value: string) {
    const textAreaDom = document.getElementById("txt-area")!
    window.fetch('http://127.0.0.1:3001/code/',{
        method:'PUT',
        body:value
    })
        .then(res => res.text())
        .then(res => textAreaDom.innerHTML = res)
        .catch(err => textAreaDom.innerHTML =err);
}

/* auto save */
function initAutoSave() {
    setInterval(function () {
        console.log("value:" + editor.getModel().getValue())
        //parent.postMessage(editor.getModel().getValue(), "*")
    }, 5000)
}

function stopAutoSave() {
    clearInterval()
}
