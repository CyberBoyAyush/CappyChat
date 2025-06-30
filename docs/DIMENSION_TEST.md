# Dimension Testing for Image Generation Models

## FLUX.1 Kontext [dev] Supported Dimensions
According to the API error, these are the exact supported dimensions:

### Supported by FLUX Kontext:
- `1568x672` ✅ (21:9 Ultrawide)
- `1392x752` ✅ (16:9 Widescreen) 
- `1184x880` ❌ (Not used - too close to 4:3)
- `1248x832` ✅ (4:3 Classic)
- `1024x1024` ✅ (1:1 Square)
- `832x1248` ❌ (Portrait - not implemented)
- `880x1184` ❌ (Portrait - not implemented)
- `752x1392` ❌ (Portrait - not implemented)
- `672x1568` ❌ (Portrait - not implemented)

## Our Implementation:

### AspectRatioSelector Configuration:
```typescript
{
  id: "1:1",
  fluxKontextDimensions: { width: 1024, height: 1024 }, // ✅ Supported
  standardDimensions: { width: 1024, height: 1024 }
},
{
  id: "21:9", 
  fluxKontextDimensions: { width: 1568, height: 672 }, // ✅ Supported
  standardDimensions: { width: 1344, height: 576 }
},
{
  id: "16:9",
  fluxKontextDimensions: { width: 1392, height: 752 }, // ✅ Supported
  standardDimensions: { width: 1344, height: 768 }
},
{
  id: "4:3",
  fluxKontextDimensions: { width: 1248, height: 832 }, // ✅ Supported
  standardDimensions: { width: 1024, height: 768 }
}
```

## Model Mapping:
- `FLUX.1 Kontext [dev]` → `runware:106@1` → Uses `fluxKontextDimensions`
- `FLUX.1 [schnell]` → `runware:100@1` → Uses `standardDimensions`
- `FLUX.1 Dev` → `runware:101@1` → Uses `standardDimensions`
- `Stable Diffusion 3` → `runware:5@1` → Uses `standardDimensions`
- `Juggernaut Pro` → `rundiffusion:130@100` → Uses `standardDimensions`

## Testing Checklist:
- [ ] Test FLUX.1 Kontext [dev] with all 4 aspect ratios
- [ ] Test other models with standard dimensions
- [ ] Verify no dimension errors occur
- [ ] Check loading animation shows correct aspect ratio
- [ ] Verify final image displays in correct aspect ratio

## Expected Behavior:
1. **FLUX Kontext Model**: Should use exact validated dimensions and work without errors
2. **Other Models**: Should use standard dimensions and work with existing flexibility
3. **UI**: Should show correct aspect ratios in both loading and final display
4. **API**: Should receive correct width/height based on model and aspect ratio selection
