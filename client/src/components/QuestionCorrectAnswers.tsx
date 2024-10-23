import React from 'react';
import { AnswerStateStats } from 'shared/responses';
import { getColors } from 'style';

export const QuestionCorrectAnswers = (props: {
  correctAnswers: string[];
  numTeams: number;
  answersStats?: AnswerStateStats;
}) => {
  if (props.correctAnswers.length === 1) {
    // the percentage of teams who got 1 answer correct (since there's only one input, then this is
    // all the data)
    const pct = Math.round(
      (100 * ((props.answersStats?.[1] as number | undefined) ?? 0)) /
        props.numTeams
    );

    return (
      <div>
        <span
          style={{
            color: getColors().TEXT_DESCRIPTION,
            margin: '9px 0',
          }}
        >
          {' '}
          Answer:{' '}
        </span>
        <span
          style={{
            color: getColors().PRIMARY_TEXT,
          }}
        >{`${props.correctAnswers[0]}`}</span>
        <span
          style={{
            color: getColors().TEXT_DEFAULT,
          }}
        >
          {' '}
          ({pct}%)
        </span>
      </div>
    );
  } else {
    const answersStats = props.answersStats ?? {};
    const pctResult: number[] = [];
    const pieFills: {
      min: number;
      max: number;
      pct: number;
      numCorrect: number;
      color: string;
    }[] = [];

    const colors = [
      'red',
      'orange',
      'yellow',
      'green',
      'lightblue',
      'indigo',
      'violet',
    ];
    let background = `conic-gradient(`;

    let ctr = 0;
    for (let i = 0; i <= props.correctAnswers.length; i++) {
      const numCorrect = i;
      const pct =
        (100 * ((answersStats[numCorrect] as number) ?? 0)) / props.numTeams;
      pctResult.push(pct);
      if (pct) {
        background += `${colors[ctr]} ${pctResult
          .slice(0, -1)
          .reduce((prev, curr) => prev + curr, 0)}% ${pctResult.reduce(
          (prev, curr) => prev + curr,
          0
        )}%, `;

        const min = Math.round(
          pctResult.slice(0, -1).reduce((prev, curr) => prev + curr, 0)
        );
        const max = Math.round(
          pctResult.reduce((prev, curr) => prev + curr, 0)
        );

        pieFills.push({
          min,
          max,
          pct,
          numCorrect,
          color: colors[ctr],
        });
      }
      ctr++;
    }
    background = background.slice(0, -2) + ')';

    return (
      <div>
        <div
          style={{
            background: getColors().BACKGROUND2,
            padding: '8px 16px 16px 10px',
            border: '1px solid ' + getColors().TEXT_DESCRIPTION,
          }}
        >
          <div
            style={{
              color: getColors().TEXT_DESCRIPTION,
              margin: '9px 0',
            }}
          >
            {' '}
            Correct Answers:{' '}
          </div>

          {props.correctAnswers.map((answer, i) => {
            return (
              <div
                key={i}
                style={{
                  marginLeft: '16px',
                  color: getColors().PRIMARY_TEXT,
                }}
              >
                - {answer}
              </div>
            );
          })}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              margin: '42px',
            }}
          >
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  width: '100%',
                  transform: 'translate(-0px, 39px)',
                }}
              >
                {pieFills
                  .filter(obj => Boolean(obj.pct))
                  .map((obj, i) => {
                    const r = 85;
                    const pie2 = 2 * Math.PI;
                    const piePct = (obj.min + (obj.max - obj.min) / 2) / 100;
                    const translate = `translate(${
                      Math.sin(pie2 * piePct) * r
                    }px, ${-Math.cos(pie2 * piePct) * r}px)`;

                    return (
                      <div
                        key={i}
                        style={{
                          color: obj.color,
                          position: 'absolute',
                          transform: translate,
                          width: '100px',
                          background: 'rgba(0, 0, 0, 0.5)',
                          textAlign: 'center',
                          fontSize: '12px',
                        }}
                      >
                        {obj.numCorrect} correct: {Math.round(obj.pct)}%
                      </div>
                    );
                  })}
              </div>
              <div
                style={{
                  background,
                  borderRadius: '50px',
                  width: '100px',
                  height: '100px',
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};
