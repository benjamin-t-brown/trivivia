import React from 'react';
import { getColors } from 'style';
import styled from 'styled-components';

const Header = styled.div(() => {
  return {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    cursor: 'pointer',
    background: getColors().BACKGROUND2,
    padding: '16px',
    borderRadius: '8px',
    margin: '4px 0px',
    userSelect: 'none' as any,
  };
});

const AccordionHeader = (
  props: React.PropsWithChildren & {
    open: boolean;
    onClick: (ev: React.MouseEvent) => void;
  }
) => {
  return (
    <Header onClick={props.onClick}>
      {props.open ? (
        // <img
        //   alt="Expand"
        //   src="/res/plain-arrow.svg"
        //   style={{
        //     transform: 'rotate(0deg)',
        //     width: '16px',
        //     marginRight: '16px',
        //     border: '1px solid ' + getColors().PRIMARY,
        //     borderRadius: '8px',
        //     padding: '4px',
        //   }}
        // />
        <span
          style={{
            marginRight: '16px',
          }}
        >
          -
        </span>
      ) : (
        // <img
        //   alt="Expand"
        //   src="/res/plain-arrow.svg"
        //   style={{
        //     transform: 'rotate(270deg)',
        //     width: '16px',
        //     marginRight: '16px',
        //     border: '1px solid ' + getColors().BACKGROUND,
        //     borderRadius: '8px',
        //     padding: '4px',
        //   }}
        // />
        <span
          style={{
            marginRight: '16px',
          }}
        >
          +
        </span>
      )}
      {props.children}
    </Header>
  );
};

export interface AccordionItem {
  item: JSX.Element;
  header: JSX.Element;
}

interface AccordionProps {
  id?: string;
  items: AccordionItem[];
}

const Accordion = (props: AccordionProps) => {
  const [openState, setOpenState] = React.useState<Record<string, boolean>>({});

  const handleHeaderClick = (index: number) => (ev: React.MouseEvent) => {
    ev.preventDefault();
    setOpenState({
      ...openState,
      [index]: !openState[index],
    });
  };

  return (
    <div className="accordion" id={props.id}>
      {props.items.map((item, index) => {
        const isOpen = openState[index];
        return (
          <div key={index}>
            <AccordionHeader onClick={handleHeaderClick(index)} open={isOpen}>
              {item.header}
            </AccordionHeader>
            <div
              style={{
                maxHeight: isOpen ? 'unset' : '0',
                transition: 'max-height 0.1s linear',
                padding: '0 16px',
                overflow: 'hidden',
              }}
            >
              <div>{item.item}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Accordion;
