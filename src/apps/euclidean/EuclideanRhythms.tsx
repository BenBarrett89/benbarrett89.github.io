"use client"

import Link from "next/link"
import { useState } from "react"

// there are more than these, but these are the most common
const timeSignatureLowerOptions = [1, 2, 4, 8, 16]

function EuclideanRhythms() {
  const [timeSignatureUpper, setTimeSignatureUpper] = useState(4);
  const [timeSignatureLower, setTimeSignatureLower] = useState(4);
  const [noteDivision, setNoteDivision] = useState(4);
  // const [numberOfBars, setNumberOfBars] = useState(1);
  // add tempo here later if adding playback

  // const [euclideanPulses, setEuclideanPulses] = useState(2);
  // const [euclideanRotation, setEuclideanRotation] = useState(4);
  // will need to look to change this later if allowing for multiple Euclidean blocks for differing lengths

  return (
    <>
      <div className="flex flex-col justify-center items-center text-center mt-4 p-4">
        <h1 className="text-4xl font-bold">Euclidean Rhythms</h1>
        <p className="py-8">
          Attempt at a simple Euclidean Rhythm display app (Work in progress)
        </p>
        <form>
          <label htmlFor="timeSignatureUpper">Time Signature Upper:</label>
          <input
            type="number"
            id="timeSignatureUpper"
            name="timeSignatureUpper"
            min="1"
            max="16"
            step="1"
            value={timeSignatureUpper}
            onChange={(e) => setTimeSignatureUpper(parseInt(e.target.value))}
            />
          <label htmlFor="timeSignatureLower">Time Signature Lower:</label>
          <select
            id="timeSignatureLower"
            name="timeSignatureLower"
            value={timeSignatureLower}
            onChange={(e) => setTimeSignatureLower(parseInt(e.target.value))}
            >
            ({timeSignatureLowerOptions.map(optionSize => 
              <option
                key={optionSize}
                value={optionSize}
                >{optionSize}</option>
            )})
          </select>
          <label htmlFor="noteDivision">Note Divsion:</label>
          <input
            type="number"
            id="noteDivision"
            name="noteDivision"
            min="1"
            max="8"
            step="1"
            value={noteDivision}
            onChange={(e) => setNoteDivision(parseInt(e.target.value))}
            />
        </form>
        <div className="flex flex-row">
          {/* Calculate and display pattern here */}
        </div>
        <div className="py-8">
          <p className="py-2">
            <Link href="/">Home</Link>
          </p>
        </div>
      </div>
    </>
  )
}

export default EuclideanRhythms
