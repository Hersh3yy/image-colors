<template>
    <div
        class="bg-white border border-gray-300 p-2 rounded-md shadow-md text-left mt-2 absolute top-20 left-1/2 transform -translate-x-1/2 z-20">
        <p class="mb-2 font-semibold">Version 1.0</p>
        <p class="mb-2">How to use the Image Color Analyzer:</p>
        <ol class="mb-2 list-disc list-inside">
            <li>Choose one or more image files using the file input above.</li>
            <li>Click the "Analyze" button to start the analysis.</li>
        </ol>
        <p class="font-semibold">Pie Chart</p>
        <ul>
            <li>Outer circle = parent colors | <a href="https://sashamaps.net/docs/resources/20-colors/" target="_blank" class="text-blue-600 underline">source</a></li>
            <li>Inner circle = actual colors</li>
        </ul>
        <br />
        <p class="font-semibold">How does it work?</p>
        <ol class="ml-4 list-decimal">
            <li>Converts the image into pixels</li>
            <li>Sorts each pixel according to color</li>
            <li>Finds clusters of pixels that are similiar colored</li>
            <li>Counts the different colors and the amount of pixels per</li>
            <li>Calculates the percantages of colors present in the image</li>
        </ol>
        <br />
        <div class="pt-10 border-l-fuchsia-700">
            <p class="mb-2 text-xl">What's coming in version 1.5:</p>
            <ul class="mb-2 list-disc list-inside">
                <li>Improved closest color and parent accuracy. <i>Use different color spaces such as CMYK, Lab, HSV to get the
                        closest color.</i></li>
                <li>Support for object analysis; when an image with a transparent background is provided.</li>
            </ul>
            <p class="mb-2 text-xl">What's coming in version 2:</p>
            <ul class="list-disc list-inside">
                <li>Save your current analysis to access later</li>
                <li>Machine learning color analysis that will ideally get more accurate over time</li>
                <li>Better visualizations: </li>
                <li>User options: user can add analysis settings such as color filters, image compression, </li>
            </ul>
        </div>
    </div>
</template>