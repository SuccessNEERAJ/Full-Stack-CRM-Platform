import React from 'react';
import { motion } from 'framer-motion';

// ShadCN-inspired Table component with animations
const Table = ({ children, className, ...props }) => {
  return (
    <div className="relative w-full overflow-auto">
      <table 
        className={`w-full caption-bottom text-sm ${className || ''}`}
        {...props}
      >
        {children}
      </table>
    </div>
  );
};

const TableHeader = ({ children, className, ...props }) => {
  return (
    <thead className={`[&_tr]:border-b ${className || ''}`} {...props}>
      {children}
    </thead>
  );
};

const TableBody = ({ children, className, ...props }) => {
  return (
    <tbody className={`[&_tr:last-child]:border-0 ${className || ''}`} {...props}>
      {children}
    </tbody>
  );
};

const TableRow = ({ children, className, isAnimated = true, ...props }) => {
  const rowAnimation = {
    initial: { opacity: 0, x: -10 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.3 }
  };

  return isAnimated ? (
    <motion.tr
      className={`border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${className || ''}`}
      {...rowAnimation}
      {...props}
    >
      {children}
    </motion.tr>
  ) : (
    <tr
      className={`border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${className || ''}`}
      {...props}
    >
      {children}
    </tr>
  );
};

const TableHead = ({ children, className, ...props }) => {
  return (
    <th
      className={`h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 ${className || ''}`}
      {...props}
    >
      {children}
    </th>
  );
};

const TableCell = ({ children, className, ...props }) => {
  return (
    <td
      className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className || ''}`}
      {...props}
    >
      {children}
    </td>
  );
};

const TableCaption = ({ children, className, ...props }) => {
  return (
    <caption
      className={`mt-4 text-sm text-muted-foreground ${className || ''}`}
      {...props}
    >
      {children}
    </caption>
  );
};

Table.Header = TableHeader;
Table.Body = TableBody;
Table.Row = TableRow;
Table.Head = TableHead;
Table.Cell = TableCell;
Table.Caption = TableCaption;

export default Table;
