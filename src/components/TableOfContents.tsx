'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
  className?: string;
  scrollContainerId?: string; // ID of the scrollable container
  onSectionSelect?: (sectionId: string) => void; // Callback when section is selected
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ 
  content, 
  className = '',
  scrollContainerId = 'wiki-content', // Default to wiki-content
  onSectionSelect
}) => {
  const [tocItems, setTocItems] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef(content);

  // Keep track of content changes
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // Extract headings from markdown content
  useEffect(() => {
    const extractHeadings = () => {
      const headings: TOCItem[] = [];
      // Match markdown headings: ## Heading, ### Heading, etc.
      const headingRegex = /^(#{1,6})\s+(.+)$/gm;
      let match;
      
      while ((match = headingRegex.exec(content)) !== null) {
        const level = match[1].length;
        const text = match[2].trim();
        // Create anchor ID from text (same logic as markdown rendering)
        // Use Unicode property escapes to support non-Latin characters (Chinese, Japanese, etc.)
        const id = text
          .toLowerCase()
          .replace(/[^\p{L}\p{N}\s-]/gu, '')
          .replace(/\s+/g, '-') || `heading-${headings.length + 1}`;
        
        headings.push({ id, text, level });
      }
      
      setTocItems(headings);
      // Reset active ID when content changes
      setActiveId(headings.length > 0 ? headings[0].id : '');
    };

    extractHeadings();
  }, [content]);

  // Track active section on scroll
  useEffect(() => {
    if (tocItems.length === 0) return;

    // Get fresh reference to scroll container
    const scrollContainer = document.getElementById(scrollContainerId);
    if (!scrollContainer) {
      console.warn(`TOC: Scroll container "${scrollContainerId}" not found`);
      return;
    }
    
    // Update ref
    scrollContainerRef.current = scrollContainer;

    const handleScroll = () => {
      const container = scrollContainerRef.current;
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      const scrollPosition = container.scrollTop + 50; // Offset from top
      
      // Find the current active heading
      let newActiveId = '';
      for (let i = tocItems.length - 1; i >= 0; i--) {
        const element = document.getElementById(tocItems[i].id);
        if (element) {
          // Calculate element's position relative to scroll container
          const elementRect = element.getBoundingClientRect();
          const elementTopInContainer = elementRect.top - containerRect.top + container.scrollTop;
          
          if (elementTopInContainer <= scrollPosition + 100) {
            newActiveId = tocItems[i].id;
            break; // Found the active one
          }
        }
      }
      
      if (newActiveId && newActiveId !== activeId) {
        setActiveId(newActiveId);
        
        // Update URL section parameter without triggering navigation
        const currentUrl = new URL(window.location.href);
        const currentSection = currentUrl.searchParams.get('section');
        if (currentSection !== newActiveId) {
          currentUrl.searchParams.set('section', newActiveId);
          window.history.replaceState({}, '', currentUrl.pathname + currentUrl.search);
        }
      }
    };

    // Initial check after a short delay to ensure DOM is ready
    const initialTimer = setTimeout(() => {
      handleScroll();
    }, 100);

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      clearTimeout(initialTimer);
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [tocItems, scrollContainerId, activeId]);

  // Handle URL section parameter - scroll to section on mount
  useEffect(() => {
    if (tocItems.length === 0) return;
    
    // Check URL for section parameter
    const currentUrl = new URL(window.location.href);
    const sectionId = currentUrl.searchParams.get('section');
    
    if (sectionId) {
      // Find the section in our items
      const sectionExists = tocItems.find(item => item.id === sectionId);
      if (sectionExists) {
        // Delay to ensure DOM is ready
        const timer = setTimeout(() => {
          const element = document.getElementById(sectionId);
          const container = document.getElementById(scrollContainerId);
          
          if (element && container) {
            const containerRect = container.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();
            const offset = 20;
            const scrollPosition = elementRect.top - containerRect.top + container.scrollTop - offset;
            
            container.scrollTo({
              top: Math.max(0, scrollPosition),
              behavior: 'auto' // Use 'auto' for initial load, not smooth
            });
            
            setActiveId(sectionId);
          }
        }, 300);
        
        return () => clearTimeout(timer);
      }
    }
  }, [tocItems, scrollContainerId]);

  // Scroll to section when clicking TOC item
  const scrollToSection = useCallback((id: string) => {
    // Get fresh references
    const container = document.getElementById(scrollContainerId);
    const element = document.getElementById(id);
    
    if (!container) {
      console.warn(`TOC: Scroll container "${scrollContainerId}" not found`);
      return;
    }
    
    if (!element) {
      console.warn(`TOC: Element with id "${id}" not found`);
      return;
    }
    
    // Calculate the position of the element relative to the scroll container
    const containerRect = container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    
    // Calculate scroll position: element's offset from container top + container's current scroll - offset
    const offset = 20; // Small offset for better visibility
    const scrollPosition = elementRect.top - containerRect.top + container.scrollTop - offset;
    
    container.scrollTo({
      top: Math.max(0, scrollPosition),
      behavior: 'smooth'
    });
    
    // Update active ID immediately for better UX
    setActiveId(id);
    
    // Notify parent component about section selection for URL update
    if (onSectionSelect) {
      onSectionSelect(id);
    }
  }, [scrollContainerId, onSectionSelect]);

  if (tocItems.length === 0) {
    return null;
  }

  return (
    <nav className={`toc-container ${className}`}>
      <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3 font-serif uppercase tracking-wide">
        On this page
      </h4>
      <ul className="space-y-1.5">
        {tocItems.map((item, index) => (
          <li
            key={`${item.id}-${index}`}
            className={`toc-item transition-all duration-200 ${
              item.level === 1 ? 'ml-0' :
              item.level === 2 ? 'ml-3' :
              item.level === 3 ? 'ml-6' :
              item.level === 4 ? 'ml-9' :
              'ml-12'
            }`}
          >
            <button
              onClick={() => scrollToSection(item.id)}
              className={`w-full text-left text-sm leading-snug transition-all duration-200 hover:text-[var(--accent-primary)] ${
                activeId === item.id
                  ? 'text-[var(--accent-primary)] font-medium'
                  : 'text-[var(--muted)]'
              } ${
                item.level === 1 ? 'font-medium' : ''
              }`}
            >
              <span className="truncate block">{item.text}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default TableOfContents;
