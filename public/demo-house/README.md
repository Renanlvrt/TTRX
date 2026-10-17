# Presenter demo house (Alt+D)

`<itemId>-in.jpg` = move-in photo, `<itemId>-out.jpg` = move-out photo. Records live in `src/data/demoHouse.ts`.

- Kitchen, bathroom, living room: the `gen-0x-*` before/after pairs from `images of house/`.
- Bedroom: real photos matched by what they show (the source filenames were mislabelled), same photo before and after.
- Fridge / Freezer move-out reuses the move-in photo (unchanged). Move-out leaves only **Oven & Hob** empty for the live upload: use `gen-01-kitchen-oven-hob-after.jpg`, choose *Existing Damage/Marks*.
