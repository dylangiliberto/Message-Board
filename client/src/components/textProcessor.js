import React, { Component } from 'react';

let t = "This is a sample message for the webiste, <green>Hello<green> should be in green and <red>DYLANNNN<red> should be in red!";
console.log("Text: " + getProcessedText(t));

function getProcessedText(text) {
    let tagOpen = text.indexOf("<");
    let tagClose = text.indexOf(">");
    let tagTwoOpen = text.indexOf("<", tagClose);
    let tagTwoClose = text.indexOf(">", tagTwoOpen);
    let colorOpen = text.substr(tagOpen + 1, (tagClose - tagOpen) - 1);
    let colorClose = text.substr(tagTwoOpen + 1, (tagTwoClose - tagTwoOpen) - 1);

    console.log(colorClose);
    console.log(colorOpen);
    console.log(tagOpen + " " + tagClose + " " + tagTwoOpen + " " + tagTwoClose);

    let output = <span>{text.substr(0, tagOpen)}</span>

    while(hasTagsLeft(text)) {
        console.log("Hey!");  

        output = output + <span style={{'color': colorOpen}}>{text.substr(tagClose + 1, tagTwoOpen - tagClose - 1)}</span>{text.substr(tagTwoClose, text.indexOf("<", tagTwoClose) - tagTwoClose)};

        text = text.substr(0, tagOpen) + text.substr(tagClose + 1, tagTwoOpen - tagClose - 1)
        + text.substr(tagTwoClose + 1, text.length - tagTwoClose);

        tagOpen = text.indexOf("<");
        tagClose = text.indexOf(">");
        tagTwoOpen = text.indexOf("<", tagClose);
        tagTwoClose = text.indexOf(">", tagTwoOpen);
        colorOpen = text.substr(tagOpen + 1, (tagClose - tagOpen) - 1);
        colorClose = text.substr(tagTwoOpen + 1, (tagTwoClose - tagTwoOpen) - 1);
    }

    output = output + text.substr(tagTwoClose, );
    console.log(output);

    return text;
}

function hasTagsLeft(text) {
    let tagOpen = text.indexOf("<");
    let tagClose = text.indexOf(">");
    let tagTwoOpen = text.indexOf("<", tagClose);
    let tagTwoClose = text.indexOf(">", tagTwoOpen);
    return tagOpen >= 0 
            && tagClose > tagOpen
            && tagTwoOpen > tagClose 
            && tagTwoClose > tagTwoOpen;
}

module.exports = {
    getProcessedText
};