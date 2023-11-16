import React from "react"
import Progress from "./components/Progress"
import { YoutubeTranscript } from 'youtube-transcript'
import './App.css'


export default function App() {
  //Model loading
  const [ready, setReady] = React.useState(null)
  const [disabled, setDisabled] = React.useState(false)
  const [progressItems, setProgressItems] = React.useState([])

  //Input and output
  const [input, setInput] = React.useState('')
  const [output, setOutput] = React.useState('')

  const worker = React.useRef(null)
  console.log(output)

  React.useEffect(() => {
    if(!worker.current) {
      worker.current = new Worker(new URL('./worker.js', import.meta.url), {type: 'module'})
    }

    const onMessageReceived = (e) => {
      switch (e.data.status) {
        case 'initiate':
          setReady(false)
          setProgressItems(prev => [...prev, e.data])
          break
        
        case 'progress':
          setProgressItems(prev => prev.map(item => {
            if (item.file === e.data.file) {
              return {...item, progress: e.data.progress}
            }
            return item
          }))
          break

        case 'done':
          setProgressItems(prev => prev.filter(item => item.file !== e.data.file))
          break

        case 'ready':
          setReady(true)
          break

        case 'update':
          setOutput(e.data.output)
          break

        case 'complete':
          setDisabled(false)
          break
      }
    }

    worker.current.addEventListener('message', onMessageReceived)

    return () => worker.current.removeEventListener('message', onMessageReceived)
  })

  function preprocessInputLink() {
    let videoId = getvideoId()
    let subtitle = YoutubeTranscript.fetchTranscript(videoId=videoId).then(console.log)
    console.log(subtitle)
  }

  function getvideoId() {
    const linkArr = input.split("/")
    const idStr = linkArr.slice(-1)
    return idStr[0].slice(0, 11)
  }
  function changeInput(event) {
    setInput(event.target.value)
  }
  function summarize() {
    // preprocessInputLink()
    setDisabled(true)
    worker.current.postMessage({
      text: input
    })
  }

  return (
    <>
      <header>
        <h2>Text Summarization using Distilled Bart</h2>
      </header>
      <div id="page-container">  
        <div class="text-container">
          <textarea value={input} placeholder="Enter your text here" onChange={e => setInput(e.target.value)}></textarea>
          <textarea placeholder="Your output will be generated here..." value={output} readOnly></textarea>  
        </div>     
        
        <button disabled={disabled} onClick={summarize}>Summarize</button>

        <div className="progress-bars-container">
            {ready === false && (<label>Loading models...(this will run only once)</label>)}
            {progressItems.map(data => (
              <div key={data.file}>
                <Progress text={data.file} percentage={data.progress} />
              </div>
            ))}
          </div>
      </div>
    </>
    
  )
}