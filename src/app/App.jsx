import "./App.css";
import { Editor } from "@monaco-editor/react";
import { useMemo, useRef } from "react";
import { MonacoBinding } from "y-monaco"; // Use to connect yjs to Monaco
import * as Y from "yjs";
import { SocketIOProvider } from "y-socket.io";

function App() {
  const editorRef = useRef(null);

  // All code is stores in docs format in  this yDoc object at frontend, Y.Doc() is a data structure which stores all the code in it this feature is by yjs
  const ydoc = useMemo(() => new Y.Doc(), []);

  //ydoc is like a big box. Inside this box, you can keep different things, like text, lists, or notes. But you need to give each thing inside the box a name, so you can find it again later. It means "Hey box (ydoc), do you have some text saved under the name 'monaco'? If yes, give it to me. If not, make a new empty one with that name."
  const yText = useMemo(() => ydoc.getText("monaco"), [ydoc]);

  const handleMount = (editor) => {
    //the editor is the editor instance which the Editor in the returned JSX will give you when it is called just like the event in a clickListener
    editorRef.current = editor;

    //Connects your y-doc to the server, Any Changes made on the frontend is carried to and from server by this provider
    const provider = new SocketIOProvider(
      "http://localhost:3000",
      "monaco",
      ydoc,
    );

    // connecting Yjs to the actual editor UI
    const binding = new MonacoBinding(
      yText,
      editorRef.current.getModel(),
      new Set([editorRef.current]),
      provider.awareness,
    );
  };
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
