import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Plus, Check } from "lucide-react";
import { debounce } from "../../utils/debounce";

const AutoComplete = ({
  value = "",
  initialValue = "",
  onChange,
  onSelect,
  searchFunction,
  placeholder = "Nhập để tìm kiếm...",
  displayField = "name",
  valueField = "id",
  createLabel = "Sẽ tạo mới",
  allowCreate = true,
  disabled = false,
  required = false,
  error = "",
  className = "",
}) => {
  const [inputValue, setInputValue] = useState(value || initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isNewItem, setIsNewItem] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Debounced search function
  const debouncedSearch = debounce(async (keyword) => {
    if (!keyword || keyword.length < 2) {
      setSuggestions([]);
      setLoading(false);
      setIsNewItem(false);
      return;
    }

    try {
      setLoading(true);
      console.log("🔍 Searching for:", keyword);
      const response = await searchFunction(keyword);
      const results = response.data || [];
      setSuggestions(results);

      // Kiểm tra xem có item nào trùng khớp chính xác không
      const exactMatch = results.find(
        (s) =>
          s[displayField] &&
          s[displayField].toLowerCase().trim() === keyword.toLowerCase().trim()
      );

      // Nếu không có trùng khớp chính xác, đánh dấu là item mới (chỉ khi cho phép tạo mới)
      setIsNewItem(allowCreate && !exactMatch);

      console.log("📋 Search results:", results.length, "items");
      console.log("🆕 Is new item:", allowCreate && !exactMatch);
    } catch (error) {
      console.error("Search error:", error);
      setSuggestions([]);
      setIsNewItem(allowCreate);
    } finally {
      setLoading(false);
    }
  }, 300);

  // Handle input change
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setShowDropdown(true);
    setSelectedIndex(-1);

    if (onChange) {
      onChange(newValue);
    }

    debouncedSearch(newValue);
  };

  // Handle option selection hoặc tự động chọn khi blur
  const handleSelectOption = (option) => {
    console.log("Selecting option:", option);

    if (option && option.isNew) {
      // Đánh dấu là item mới, không tạo ngay
      const newItem = {
        isNewItem: true,
        [displayField]: inputValue.trim(),
        tempId: `new_${Date.now()}`, // ID tạm thời
        [valueField]: null,
      };

      setInputValue(inputValue.trim());
      setIsNewItem(true);

      if (onSelect) {
        onSelect(newItem);
      }
    } else if (option) {
      // Chọn item có sẵn
      setInputValue(option[displayField]);
      setIsNewItem(false);

      if (onSelect) {
        onSelect(option);
      }
    }

    setShowDropdown(false);
    setSelectedIndex(-1);
  };

  // Handle blur - tự động chọn nếu có input nhưng chưa chọn gì
  const handleBlur = () => {
    setTimeout(() => {
      if (inputValue.trim() && !showDropdown && allowCreate) {
        // Kiểm tra xem đã chọn item nào chưa
        const trimmedInput = inputValue.trim();
        const exactMatch = suggestions.find(
          (s) =>
            s[displayField] &&
            s[displayField].toLowerCase() === trimmedInput.toLowerCase()
        );

        if (!exactMatch && trimmedInput.length >= 2) {
          // Tự động đánh dấu là item mới
          handleSelectOption({ isNew: true });
        }
      }
    }, 150); // Delay để click option có thể hoạt động
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showDropdown) return;

    const hasCreateOption = shouldShowCreateOption();
    const totalOptions = suggestions.length + (hasCreateOption ? 1 : 0);

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < totalOptions - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : totalOptions - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          const isNewOption = selectedIndex === suggestions.length;
          if (isNewOption && hasCreateOption) {
            handleSelectOption({ isNew: true });
          } else if (selectedIndex < suggestions.length) {
            handleSelectOption(suggestions[selectedIndex]);
          }
        } else if (inputValue.trim().length >= 2 && allowCreate) {
          // Enter mà không chọn gì thì tự động tạo mới (chỉ khi cho phép)
          handleSelectOption({ isNew: true });
        }
        break;
      case "Escape":
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update input value when value prop changes
  useEffect(() => {
    if (value !== undefined && value !== inputValue) {
      setInputValue(value);
    }
  }, [value]);

  // Initialize with initialValue only once
  useEffect(() => {
    if (!hasInitialized && initialValue) {
      setInputValue(initialValue);
      setHasInitialized(true);
    }
  }, [initialValue, hasInitialized]);

  // Reset initialization flag when initialValue changes significantly
  useEffect(() => {
    if (initialValue !== inputValue && initialValue) {
      setInputValue(initialValue);
    }
  }, [initialValue]);

  // Check if should show create option
  const shouldShowCreateOption = () => {
    if (!allowCreate) return false;

    const trimmedInput = inputValue.trim();
    if (!trimmedInput || trimmedInput.length < 2) return false;

    if (suggestions.length === 0) return true;

    const exactMatch = suggestions.find(
      (s) =>
        s[displayField] &&
        s[displayField].toLowerCase().trim() === trimmedInput.toLowerCase()
    );

    return !exactMatch;
  };

  const defaultRenderOption = (option, index) => (
    <div
      key={option[valueField] || `option-${index}`}
      className={`px-4 py-2 cursor-pointer border-l-4 transition-colors ${
        selectedIndex === index
          ? "bg-green-50 border-green-500 text-green-900"
          : "border-transparent hover:bg-gray-50"
      }`}
      onClick={() => handleSelectOption(option)}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium text-gray-900">
            {option[displayField]}
          </div>
          {option.ma_hang_hoa && (
            <div className="text-sm text-gray-500">
              Mã: {option.ma_hang_hoa}
            </div>
          )}
          {option.ma_ncc && (
            <div className="text-sm text-gray-500">Mã: {option.ma_ncc}</div>
          )}
          {option.don_vi_tinh && (
            <div className="text-sm text-gray-500">
              ĐVT: {option.don_vi_tinh}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowDropdown(true)}
          onBlur={handleBlur}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm ${
            error ? "border-red-500" : "border-gray-300"
          } ${disabled ? "bg-gray-100 cursor-not-allowed" : ""} ${
            isNewItem ? "bg-yellow-50 border-yellow-300" : ""
          }`}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          {loading ? (
            <div className="animate-spin h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full"></div>
          ) : isNewItem ? (
            <Plus className="h-4 w-4 text-yellow-600" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* {isNewItem && inputValue.trim() && allowCreate && (
        <div className="mt-1 text-xs text-yellow-600 flex items-center">
          <Plus className="h-3 w-3 mr-1" />
          Sẽ tạo mới: "{inputValue.trim()}"
        </div>
      )} */}

      {error && <div className="mt-1 text-sm text-red-600">{error}</div>}

      {showDropdown && inputValue.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-2 text-gray-500 text-sm flex items-center">
              <div className="animate-spin h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full mr-2"></div>
              Đang tìm kiếm...
            </div>
          ) : (
            <>
              {suggestions.map((option, index) =>
                defaultRenderOption(option, index)
              )}

              {shouldShowCreateOption() && (
                <div
                  className={`px-4 py-2 cursor-pointer ${
                    suggestions.length > 0 ? "border-t border-gray-100" : ""
                  } border-l-4 transition-colors ${
                    selectedIndex === suggestions.length
                      ? "bg-yellow-50 border-yellow-500 text-yellow-900"
                      : "border-transparent hover:bg-yellow-25"
                  }`}
                  onClick={() => handleSelectOption({ isNew: true })}
                >
                  <div className="flex items-center space-x-2">
                    <Plus className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium text-yellow-700">
                      {createLabel}: "{inputValue.trim()}"
                    </span>
                  </div>
                </div>
              )}

              {suggestions.length === 0 && !shouldShowCreateOption() && (
                <div className="px-4 py-2 text-gray-500 text-sm">
                  Nhập ít nhất 2 ký tự để tìm kiếm
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AutoComplete;
