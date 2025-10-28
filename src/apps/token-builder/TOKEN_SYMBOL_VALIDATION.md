# Token Symbol Validation

## Overview

Implemented strict validation for token symbols with real-time input filtering and step-by-step validation to ensure data quality.

---

## Symbol Requirements

### ✅ Valid Symbol Format

**Rules:**
- **Length**: 3-5 characters
- **Characters**: Only uppercase letters (A-Z)
- **No numbers**: Digits are not allowed
- **No special characters**: Only letters

**Valid Examples:**
- `BTC` ✅
- `ETH` ✅
- `TOKEN` ✅
- `STELS` ✅

**Invalid Examples:**
- `BT` ❌ (too short, min 3)
- `TOKENS` ❌ (too long, max 5)
- `BTC1` ❌ (contains number)
- `BT-C` ❌ (contains special character)
- `btc` ❌ (lowercase, must be uppercase)

---

## Real-time Input Filtering

### Auto-uppercase Conversion

Input automatically converts to uppercase:

```typescript
onChange={(e) => {
  const cleaned = e.target.value.toUpperCase().replace(/[^A-Z]/g, "");
  updateMetadata({
    symbol: sanitizeInput(cleaned),
  });
}}
```

**User Experience:**
- User types: `btc123`
- Input shows: `BTC`
- Numbers and special characters removed automatically

### Character Filtering

Only A-Z letters allowed:
- **Input**: `btc123!@#`
- **Result**: `BTC`

### Length Limits

HTML attributes enforce limits:
```html
<Input
  maxLength={5}
  minLength={3}
  className="uppercase"
/>
```

---

## Step-by-Step Validation

### Validation on Step Navigation

Before advancing to the next step, all fields are validated:

```typescript
const validateCurrentStep = (): boolean => {
  validateSchema();
  
  const stepRequirements: Record<number, string[]> = {
    0: ["standard"],
    1: ["metadata.name", "metadata.symbol", "metadata.description"],
    2: ["economics.supply.initial", "economics.supply.mintingPolicy"],
    3: [],
    4: [],
  };
  
  const requiredFields = stepRequirements[currentStep] || [];
  const stepErrors = requiredFields.filter((field) => field in errors);
  
  // Additional validation for symbol
  if (currentStep === 1 && schema.metadata?.symbol) {
    const symbol = schema.metadata.symbol.trim().toUpperCase();
    if (symbol.length < 3 || symbol.length > 5 || !/^[A-Z]+$/.test(symbol)) {
      return false;
    }
  }
  
  return stepErrors.length === 0;
};
```

### Next Button State

Button is disabled if current step is invalid:

```typescript
<Button
  onClick={handleNextStep}
  disabled={currentStep === steps.length - 1 || !validateCurrentStep()}
>
  Next
</Button>
```

**User Experience:**
- ✅ **Valid**: Button is clickable
- ❌ **Invalid**: Button is disabled (grayed out)
- 💡 **Error messages**: Show validation errors below fields

---

## Validation Rules (validation.ts)

### Symbol Validation Logic

```typescript
// Validate symbol (trim for validation only)
const trimmedSymbol = metadata.symbol?.trim().toUpperCase() || "";

if (!trimmedSymbol || trimmedSymbol.length === 0) {
  errors.push({
    field: "metadata.symbol",
    message: "Token symbol is required",
    code: "REQUIRED",
  });
} else if (trimmedSymbol.length < 3) {
  errors.push({
    field: "metadata.symbol",
    message: "Token symbol must be at least 3 characters",
    code: "MIN_LENGTH",
  });
} else if (trimmedSymbol.length > 5) {
  errors.push({
    field: "metadata.symbol",
    message: "Token symbol must be 5 characters or less",
    code: "MAX_LENGTH",
  });
} else if (!/^[A-Z]+$/.test(trimmedSymbol)) {
  errors.push({
    field: "metadata.symbol",
    message: "Token symbol must contain only uppercase letters (no numbers or special characters)",
    code: "INVALID_FORMAT",
  });
}
```

### Error Codes

- `REQUIRED`: Field is missing
- `MIN_LENGTH`: Too short (< 3 characters)
- `MAX_LENGTH`: Too long (> 5 characters)
- `INVALID_FORMAT`: Contains invalid characters

---

## Step Requirements

### Step 1: Standard Selection
**Required:**
- `standard` - Token standard (fungible, NFT, etc.)

### Step 2: Token Information
**Required:**
- `metadata.name` - Token name
- `metadata.symbol` - Token symbol (3-5 uppercase letters)
- `metadata.description` - Token description

**Optional:**
- `metadata.icon` - Token icon (Data URL, max 128KB)
- `metadata.contact` - Contact email
- `metadata.website` - Website URL
- `metadata.social` - Social links

### Step 3: Economics
**Required:**
- `economics.supply.initial` - Initial supply
- `economics.supply.mintingPolicy` - Minting policy (fixed, unlimited, etc.)

**Optional:**
- `economics.supply.max` - Max supply
- `economics.distribution` - Distribution allocations
- `economics.feeStructure` - Token fee structure
- `economics.treasury` - Treasury address

### Step 4: Optional Features
**All optional:**
- `governance` - Governance settings
- `transferRestrictions` - Transfer restrictions
- `customFields` - Custom metadata

### Step 5: Review & Sign
**No validation needed** - Final review before signing

---

## Error Display

### Inline Errors

Errors appear below each field:

```tsx
<Input
  id="symbol"
  value={schema.metadata?.symbol || ""}
  onChange={...}
  placeholder="e.g., TOKEN (3-5 letters)"
  className="h-8 text-xs uppercase"
  maxLength={5}
  minLength={3}
/>
{errors["metadata.symbol"] && (
  <p className="text-xs text-red-500 mt-1">
    {errors["metadata.symbol"][0]}
  </p>
)}
```

### Footer Error Count

Total error count displayed in footer:

```tsx
{Object.keys(errors).length > 0 && (
  <div className="flex items-center gap-1 text-xs text-red-600">
    <AlertCircle className="w-3 h-3" />
    <span>{Object.keys(errors).length} errors</span>
  </div>
)}
```

---

## Files Modified

### `/src/apps/token-builder/validation.ts`
- Updated `validateMetadata()` function
- Symbol min length: 3 characters
- Symbol max length: 5 characters
- Regex changed from `/^[A-Z0-9]+$/` to `/^[A-Z]+$/` (no numbers)
- Auto-uppercase: `.toUpperCase()` added

### `/src/apps/token-builder/token-builder.tsx`
- Added `validateCurrentStep()` function
- Added `handleNextStep()` function with validation
- Updated symbol input with real-time filtering
- Changed `maxLength` from 12 to 5
- Added `minLength={3}`
- Added `className="uppercase"` for visual feedback
- Updated placeholder to show requirements

---

## Testing

### Manual Testing Steps

**Step 1: Try invalid symbols**
1. Type `bt` → Error: "Token symbol must be at least 3 characters"
2. Type `tokens` → Input caps at 5 chars: `TOKEN`
3. Type `btc123` → Numbers removed: `BTC`
4. Type `bt-c` → Special chars removed: `BTC`

**Step 2: Try valid symbols**
1. Type `btc` → Converts to: `BTC` ✅
2. Type `token` → Converts to: `TOKEN` ✅
3. Type `STELS` → Stays: `STELS` ✅

**Step 3: Test step navigation**
1. Leave symbol empty → Next button disabled
2. Enter valid symbol → Next button enabled
3. Click Next → Advances to next step

---

## Benefits

✅ **Data Quality**: Only valid symbols accepted
✅ **User Experience**: Real-time feedback and filtering
✅ **Prevention**: Impossible to submit invalid data
✅ **Clear Errors**: Specific error messages
✅ **Standards Compliance**: Follows best practices (3-5 uppercase letters)
✅ **Step Validation**: Ensures all required fields filled

---

## Next Steps

Potential enhancements:
- Check symbol uniqueness against existing tokens
- Reserved symbol validation (prevent: USD, EUR, etc.)
- Symbol availability check via API
- Symbol suggestions based on token name

---

Token Symbol Validation v1.0
Strict validation for professional token creation! ✅
