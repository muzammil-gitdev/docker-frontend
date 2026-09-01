import "./App.css";
import { Editor } from "@monaco-editor/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { MonacoBinding } from "y-monaco"; // Use to connect yjs to Monaco
import * as Y from "yjs";
import { SocketIOProvider } from "y-socket.io";

// install monaco-editor@0.44.0 along with monaco-editor/react

function App() {
  const editorRef = useRef(null);
  const [username, setUsername] = useState(() => {
    return new URLSearchParams(window.location.search).get("username") || "";
  });
  const [users, setUsers] = useState([]);

  // All code is stores in docs format in  this yDoc object at frontend, Y.Doc() is a data structure which stores all the code in it this feature is by yjs
  //ydoc is like a big box. Inside this box, you can keep different things, like text, lists, or notes. But you need to give each thing inside the box a name, so you can find it again later. It means "Hey box (ydoc), do you have some text saved under the name 'monaco'? If yes, give it to me. If not, make a new empty one with that name."
  const ydoc = useMemo(() => new Y.Doc(), []);

  //A Y.Doc can hold multiple shared data types (text, arrays, maps, etc.), each identified by a name. Here, "monaco" is just a key/label — like naming a specific tab in a shared spreadsheet. Here "monaco" for the code or maybe "chat" for the chat conversation
  const yText = useMemo(() => ydoc.getText("monaco"), [ydoc]);

  const handleMount = (editor) => {
    //the editor is the editor instance which the Editor in the returned JSX will give you when it is called just like the event in a clickListener
    editorRef.current = editor;
  };

  const handleJoin = (e) => {
    e.preventDefault();
    setUsername(e.target.username.value);
    window.history.pushState({}, "", "?username=" + e.target.username.value);
  };

  useEffect(() => {
    if (username && editorRef.current) {
      //Connects your y-doc to the server, Any Changes made on the frontend is carried to and from server by this provider
      const provider = new SocketIOProvider(
        "http://localhost:3000",
        "monaco",
        ydoc,
        {
          autoConnect: true,
        },
      );

      //Set the username to awareness local state fields
      provider.awareness.setLocalStateField("users", { username });

      // This step is to extract all the usernames from the awareness local state fields and map them to states so multiple users means multiple states
      provider.awareness.on("change", () => {
        const states = Array.from(provider.awareness.getStates().values());
        setUsers.map(
          states
            .filter((user) => user && user.username)
            .map((state) => state.user),
        );
      });

      function handleBeforeUnload() {
        provider.awareness.setLocalStateField("user", null);
      }

      //fires right before the page is about to be unloaded — meaning the user is closing the tab, closing the browser, navigating to a different URL, or refreshing the page.
      window.addEventListener("beforeunload", handleBeforeUnload);

      // connecting Yjs to the actual editor UI
      const monacoBinding = new MonacoBinding(
        yText,
        editorRef.current.getModel(),
        new Set([editorRef.current]),
        //shares ephemeral info like cursor position, users name, selection highlight — not the document content itself, but "presence" info
        provider.awareness,
      );

      return () => {
        monacoBinding.destroy();
        provider.disconnect();
        window.removeEventListener("beforeunload", handleBeforeUnload);
      };
    }
  }, [username, editorRef.current]);

  if (!username) {
    return (
      <main className="h-screen w-full bg-gray-950 flex gap-4 p-4 items-center justify-center">
        <form className="flex flex-col gap-4" onSubmit={handleJoin}>
          <input
            className="p-2 rounded-lg bg-gray-800 text-white"
            placeholder="Enter Your Name"
            type="text"
            name="username"
          />
          <button className="p-2 rounded-lg bg-amber-50 text-gray-950 font-bold">
            Join
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="h-screen w-full bg-gray-950 flex gap-4 p-4">
      <aside className="h-full w-1/4 bg-amber-50 rounded-lg"></aside>
      <section className="w-3/4 bg-neutral-800 rounded-lg overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          defaultValue="//some content"
          theme="vs-dark"
          onMount={handleMount}
        ></Editor>
      </section>
    </main>
  );
}

export default App;
