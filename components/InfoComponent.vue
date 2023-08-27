<template>
    <div
        class="bg-white border border-gray-300 p-2 rounded-md shadow-md text-left mt-2 absolute top-20 left-1/2 transform -translate-x-1/2 z-20">
        <p class="mb-2 font-semibold">Version 1.0</p>
        <p class="mb-2">How to use the Image Color Analyzer:</p>
        <ol class="mb-2 list-disc list-inside">
            <li>Choose one or more image files using the file input above.</li>
            <li>Click the "Analyze" button to start the analysis.</li>
        </ol>
        <br />
        <p class="font-semibold">How does the image analysis work?</p>
        <ol class="ml-4 list-decimal">
            <li>The image is converted into a collection of pixels</li>
            <li>The pixels are sorted by colors.</li>
            <li>Similiar colored pixels are clustered together.</li>
            <li>Counts the different color clusters and how much of the image they each take up.</li>
        </ol>
        <br />
    </div>
</template>