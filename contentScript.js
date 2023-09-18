(() => {
    let questionElements;
    let currentSavedQuestions;

    const fetchQuestions = () => {
        return new Promise((resolve) => {
            chrome.storage.local.get(["questions"], (obj) => {
                resolve(obj["questions"] ? JSON.parse(obj["questions"]) : []);
            });
        });
    };

    const fullLinkFromQuestion = (questionElement) => {
        return questionElement.getElementsByTagName("a")[0].href;
    };

    const shortLinkFromQuestion = (questionElement) => {
        return fullLinkFromQuestion(questionElement).replace("https://db.chgk.info/question/", "");
    };

    const parseQuestionElement = (questionElement) => {
        if (questionElement.getElementsByClassName("razdatka").length > 0) {
            //return parseQuestionWithRazdatka(questionElement)
        }

        const questionLink = fullLinkFromQuestion(questionElement);
        const questionTitle = questionLink.replace("https://db.chgk.info/question/", "");
        const questionFullText = questionElement.children[questionElement.children.length - 2].textContent;
        const questionContents = questionElement.getElementsByTagName("p");

        let questionText = ""
        if (questionFullText.startsWith("Вопрос")) {
            questionText = questionFullText.slice(questionFullText.indexOf(":") + 1).trim();
        } else {
            questionText = questionFullText.trim();
        }

        let content, contentText, answerText = null, acceptedText = null, commentText = null;
        for (let i= 0; i < questionContents.length; i++){
            content = questionContents[i];
            contentText = questionContents[i].textContent;

            if (content.getElementsByClassName("Question").length > 0){
                questionText = contentText.slice(contentText.indexOf(":") + 1).trim();
            } else if (content.getElementsByClassName("Answer").length > 0){
                answerText = contentText.slice(contentText.indexOf(":") + 1).trim();
            } else if (content.getElementsByClassName("PassCriteria").length > 0){
                acceptedText = contentText.trim();
            } else if (content.getElementsByClassName("Comments").length > 0){
                commentText = contentText.trim();
            }
        }

         return {
            short_link: questionTitle,
            questionText: questionText,
            answerText: answerText,
            acceptedText: acceptedText,
            commentText: commentText
        };
    }

    const parseQuestionWithRazdatka = (questionElement) => {

    }

    const updateButtons = (questionElement) => {
        let addButton = questionElement.getElementsByClassName("add-button")[0];
        let deleteButton = questionElement.getElementsByClassName("delete-button")[0];

        const savedQuestionsLinks = currentSavedQuestions.map(function (q) {return q.short_link});
        const questionAlreadyAdded = savedQuestionsLinks.includes(shortLinkFromQuestion(questionElement));
        const showHideClass = [" button-hidden", ""];

        addButton.className = "material-symbols-outlined small-button add-button signature-green" +
                              showHideClass[questionAlreadyAdded === true ? 0 : 1];
        deleteButton.className = "material-symbols-outlined small-button delete-button signature-green" +
                                 showHideClass[questionAlreadyAdded === true ? 1 : 0];
    };

    const addNewQuestionEventHandler = async (questionElement) => {
        const savedQuestionsLinks = currentSavedQuestions.map(function (q) {return q.short_link});
        if (!savedQuestionsLinks.includes(shortLinkFromQuestion(questionElement))) {
            const newSavedQuestion = parseQuestionElement(questionElement);

            currentSavedQuestions = await fetchQuestions();
            currentSavedQuestions = [...currentSavedQuestions, newSavedQuestion]
            chrome.storage.local.set({
                ["questions"]: JSON.stringify(currentSavedQuestions) // КОСТЫЛЬ, НАДО ВСЕХ ОТДЕЛЬНО ХРАНИТЬ
            });
            console.log("Added a new question at " + newSavedQuestion["short_link"]);
            console.log(newSavedQuestion);
            chrome.storage.local.get(["questions"]).then((result) => {
                console.log(result);
            });

            updateButtons(questionElement);
        }
    };

    const deleteQuestion = async (questionShortLink) => {
        currentSavedQuestions = await fetchQuestions();
        const savedQuestionsLinks = currentSavedQuestions.map(function (q) {return q.short_link});
        if (savedQuestionsLinks.includes(questionShortLink)) {
            const allQuestionElements = document.getElementsByClassName("question");
            let questionElement = Array.from(allQuestionElements).filter(
                (q) => shortLinkFromQuestion(q) === questionShortLink)[0];

            currentSavedQuestions = currentSavedQuestions.filter((b) => b.short_link !== questionShortLink);
            chrome.storage.local.set({["questions"]: JSON.stringify(currentSavedQuestions)});

            updateButtons(questionElement);
        }
    };

    function arrayMoveMutable(array, fromIndex, toIndex) {
        const startIndex = fromIndex < 0 ? array.length + fromIndex : fromIndex;

        if (startIndex >= 0 && startIndex < array.length) {
            const endIndex = toIndex < 0 ? array.length + toIndex : toIndex;

            const [item] = array.splice(fromIndex, 1);
            array.splice(endIndex, 0, item);
        }
    }
    function arrayMoveImmutable(array, fromIndex, toIndex) {
        array = [...array];
        arrayMoveMutable(array, fromIndex, toIndex);
        return array;
    }
    const moveQuestion = async (fromIndex, toIndex) => {
        currentSavedQuestions = await fetchQuestions();
        currentSavedQuestions = arrayMoveImmutable(currentSavedQuestions, fromIndex, toIndex);
        chrome.storage.local.set({["questions"]: JSON.stringify(currentSavedQuestions)});
    }

    const newPageLoaded = () => {

        questionElements = document.getElementsByClassName("question");
        for (let i = 0; i < questionElements.length; i++) {
            let questionElement = questionElements[i];
            let innerQuestionElement = questionElement.getElementsByClassName("Question")[0];


            const addButton = document.createElement("span");
            addButton.title = "Добавить вопрос в подборку";
            addButton.textContent = "add";
            addButton.className = "material-symbols-outlined small-button add-button signature-green";
            addButton.draggable = false;

            const deleteButton = document.createElement("span");
            deleteButton.title = "Удалить вопрос из подборки";
            deleteButton.textContent = "delete";
            deleteButton.className = "material-symbols-outlined small-button delete-button signature-green";
            deleteButton.draggable = false;

            innerQuestionElement.prepend(addButton);
            innerQuestionElement.prepend(deleteButton);

            updateButtons(questionElement);

            addButton.addEventListener("click",
                async () => {await addNewQuestionEventHandler(questionElement)});
            deleteButton.addEventListener("click",
                async () => {await deleteQuestion(shortLinkFromQuestion(questionElement))});
        }
    }

    chrome.runtime.onMessage.addListener((obj, sender, sendResponse) => {
        const { type, value} = obj;

        (async () => {
            currentSavedQuestions = await fetchQuestions();
            if (type === "NEW") {
                newPageLoaded();
            } else if (type === "GIVE_UPDATE"){
                sendResponse(currentSavedQuestions);
            } else if ( type === "DELETE") {
                await deleteQuestion(value);
                sendResponse(currentSavedQuestions);
            } else if ( type === "MOVE") {
                await moveQuestion(value.from, value.to);
                sendResponse(currentSavedQuestions);
            }
        })();

        return true;
    })

//     const DEL_SELECTOR = 'script, meta';
//
//     const mo = new MutationObserver(onMutation);
// // in case the content script was injected after the page is partially loaded
//     onMutation([{addedNodes: [document.documentElement]}]);
//     observe();
//
//     function onMutation(mutations) {
//         let stopped;
//         for (const {addedNodes} of mutations) {
//             for (const n of addedNodes) {
//                 if (n.tagName) {
//                     if (n.matches(DEL_SELECTOR)) {
//                         stopped = true;
//                         mo.disconnect();
//                         console.log(n);
//                         n.remove();
//                     } else if (n.firstElementChild && n.querySelector(DEL_SELECTOR)) {
//                         stopped = true;
//                         mo.disconnect();
//                         for (const el of n.querySelectorAll(DEL_SELECTOR)) {
//                             console.log(el);
//                             el.remove();
//                         }
//                     }
//                 }
//             }
//         }
//         if (stopped) observe();
//     }
//
//     function observe() {
//         mo.observe(document, {
//             subtree: true,
//             childList: true,
//         });
//     }


})();