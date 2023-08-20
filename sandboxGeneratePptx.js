
const generatePptx = async (event) => {
    let pptx = new PptxGenJS();
    let slide = pptx.addSlide();

    slide.addText("Тренировка", {
        x: 0,
        y: 1,
        w: "100%",
        h: 2,
        align: "center",
        color: "0088CC",
        fill: { color: "F1F1F1" },
        fontSize: 24,
    });
    slide.addText("Эта презентация сгенерирована автоматически прямо в браузере", {
        x: 0,
        y: 1.5,
        w: "100%",
        h: 2,
        align: "center",
        color: "22AAEE",
        fontSize: 12,
    });

    const questionsData = event.data["questions_info"];

    let question;
    for (let i=0; i<questionsData.length; i++){
        question = questionsData[i];
        let questionSlide = pptx.addSlide();
        questionSlide.addText("Вопрос " + (i+1),{
            x: 0,
            y: 0.2,
            w: "20%",
            h: 2,
            align: "left",
            color: "0088CC",
            fill: { color: "F1F1F1" },
            fontSize: 24,
        });
        questionSlide.addText(question["questionText"],{
            x: 0,
            y: 2,
            w: "100%",
            h: 2,
            align: "center",
            color: "111111",
            fontSize: 20,
        });
        let answerSlide = pptx.addSlide();
        answerSlide.addText("Ответ",{
            x: 0,
            y: 0.2,
            w: "20%",
            h: 2,
            align: "left",
            color: "0088CC",
            fill: { color: "F1F1F1" },
            fontSize: 24,
        });
        const acceptedText = question["acceptedText"] ? "\n" + question["acceptedText"] : ""
        const commentText = question["commentText"] ? "\n" + question["commentText"] : ""
        const fullAnswerText = question["answerText"] + acceptedText + commentText

        answerSlide.addText(fullAnswerText,{
            x: 0,
            y: 2,
            w: "100%",
            h: 2,
            align: "center",
            color: "111111",
            fontSize: 20,
        });
    }


    let data = await pptx.write("blob")

    event.source.window.postMessage(data, event.origin);
};

window.addEventListener('message', generatePptx);