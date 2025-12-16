import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface LayoutContextType {
    headerTitle: string;
    setHeaderTitle: (title: string) => void;
    headerElements: ReactNode;
    setHeaderElements: (elements: ReactNode) => void;
    isHeaderCollapsed: boolean;
    setIsHeaderCollapsed: (collapsed: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [headerTitle, setHeaderTitle] = useState('');
    const [headerElements, setHeaderElements] = useState<ReactNode>(null);
    const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

    return (
        <LayoutContext.Provider value={{
            headerTitle,
            setHeaderTitle,
            headerElements,
            setHeaderElements,
            isHeaderCollapsed,
            setIsHeaderCollapsed
        }}>
            {children}
        </LayoutContext.Provider>
    );
};

export const useLayout = () => {
    const context = useContext(LayoutContext);
    if (!context) {
        throw new Error('useLayout must be used within a LayoutProvider');
    }
    return context;
};
