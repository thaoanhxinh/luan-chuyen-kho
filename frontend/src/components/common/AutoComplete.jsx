import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, X } from "lucide-react";

const AutoComplete = ({
  searchFunction,
  onSelect,
  onChange,
  value,
  placeholder = "Nhập để tìm kiếm...",
  displayField = "name",
  searchField = "name",
  renderItem,
  className = "",
  disabled = false,
  required = false,
  initialValue = null,
  debounceMs = 300,
  allowCreateOption = false,
  showCreateOption = false,
  createNewLabel = "Tạo mới",
  noResultsText = "Không tìm thấy kết quả",
  loadingText = "Đang tìm kiếm...",
  minSearchLength = 0,
  searchDelay = 300,
  clearable = false,
  clearText = "Xóa",
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(value || initialValue);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !inputRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset when initialValue changes
  useEffect(() => {
    setSelectedItem(initialValue);
    if (initialValue) {
      setQuery(initialValue[displayField] || "");
    } else {
      setQuery("");
    }
  }, [initialValue, displayField]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (query.trim().length >= minSearchLength && !selectedItem) {
        performSearch(query.trim());
      } else if (query.trim().length < minSearchLength) {
        setResults([]);
        setIsOpen(false);
      }
    }, searchDelay);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, selectedItem, debounceMs]);

  const performSearch = async (searchQuery) => {
    if (!searchFunction || isLoading) return;

    setIsLoading(true);
    setFocusedIndex(-1);

    try {
      const searchResults = await searchFunction(searchQuery);
      setResults(Array.isArray(searchResults) ? searchResults : []);
      setIsOpen(true);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    // Clear selection if user is typing
    if (selectedItem) {
      setSelectedItem(null);
    }

    // Show dropdown if there are cached results
    if (value.trim().length >= 2 && results.length > 0) {
      setIsOpen(true);
    }
  };

  const handleInputFocus = () => {
    if (results.length > 0 && query.trim().length >= 2) {
      setIsOpen(true);
    }
  };

  const handleItemSelect = (item) => {
    setSelectedItem(item);
    setQuery(item[displayField] || "");
    setIsOpen(false);
    setFocusedIndex(-1);
    setResults([]);
    onSelect?.(item);
  };

  const handleClear = () => {
    setSelectedItem(null);
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setFocusedIndex(-1);
    onSelect?.(null);
    onChange?.(null);
    inputRef.current?.focus();
  };

  const handleCreateNew = (newValue) => {
    const newItem = {
      id: `new_${Date.now()}`,
      [displayField]: newValue,
      isNewItem: true,
    };

    console.log("🔍 AutoComplete handleCreateNew:", {
      newValue,
      displayField,
      newItem,
    });

    setSelectedItem(newItem);
    setQuery(newValue);
    setResults([]);
    setIsOpen(false);
    setFocusedIndex(-1);

    console.log("🔍 AutoComplete calling onChange with:", newItem);
    onSelect?.(newItem);
    onChange?.(newItem);
  };

  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) {
      if (
        e.key === "ArrowDown" &&
        results.length === 0 &&
        query.trim().length >= 2
      ) {
        performSearch(query.trim());
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0 && results[focusedIndex]) {
          handleItemSelect(results[focusedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setFocusedIndex(-1);
        inputRef.current?.blur();
        break;
      default:
        break;
    }
  };

  const getDisplayValue = () => {
    if (selectedItem) {
      return selectedItem[displayField] || "";
    }
    return query;
  };

  const shouldShowClear = selectedItem || query.trim().length > 0;

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={getDisplayValue()}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={`
              w-full pl-10 pr-10 py-2 border rounded-lg text-sm transition-colors
              ${
                disabled
                  ? "bg-gray-100 cursor-not-allowed"
                  : "bg-white hover:border-gray-400"
              }
              ${
                selectedItem
                  ? "border-green-300 bg-green-50"
                  : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              }
            `}
            autoComplete="off"
          />

          {/* Search icon */}
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={16}
          />

          {/* Right icons */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            )}

            {shouldShowClear && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-0.5 hover:bg-gray-200 rounded-full transition-colors"
                title="Xóa"
              >
                <X size={14} className="text-gray-400 hover:text-gray-600" />
              </button>
            )}

            <ChevronDown
              className={`text-gray-400 transform transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
              size={16}
            />
          </div>
        </div>

        {/* Selection indicator */}
        {selectedItem && (
          <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-green-500 rounded-full"></div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {isLoading ? (
            <div className="p-3 text-center text-gray-500 text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mx-auto mb-2"></div>
              Đang tìm kiếm...
            </div>
          ) : results.length > 0 ? (
            <ul className="py-1">
              {results.map((item, index) => (
                <li key={item.id || index}>
                  <button
                    type="button"
                    onClick={() => handleItemSelect(item)}
                    className={`
                      w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors
                      ${index === focusedIndex ? "bg-blue-50" : ""}
                      ${item.isNewItem ? "border-l-4 border-blue-400" : ""}
                    `}
                    onMouseEnter={() => setFocusedIndex(index)}
                  >
                    {renderItem ? (
                      renderItem(item)
                    ) : (
                      <div>
                        <div className="font-medium text-gray-900">
                          {item[displayField]}
                        </div>
                        {item.isNewItem && (
                          <div className="text-xs text-blue-600 mt-1">
                            💡 Tạo mới
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : query.trim().length >= minSearchLength ? (
            <div className="p-3 text-center text-gray-500 text-sm">
              {noResultsText}
              {allowCreateOption && query.trim().length >= 2 && (
                <button
                  type="button"
                  onClick={() => {
                    console.log("🔍 Create button clicked for:", query.trim());
                    handleCreateNew(query.trim());
                  }}
                  className="block w-full mt-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded border border-blue-200 hover:border-blue-300 transition-colors"
                >
                  {createNewLabel}: "{query.trim()}"
                </button>
              )}
              {console.log(
                "🔍 AutoComplete render - allowCreateOption:",
                allowCreateOption,
                "query length:",
                query.trim().length,
                "minSearchLength:",
                minSearchLength
              )}
            </div>
          ) : (
            <div className="p-3 text-center text-gray-500 text-sm">
              Nhập ít nhất {minSearchLength} ký tự để tìm kiếm
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AutoComplete;
