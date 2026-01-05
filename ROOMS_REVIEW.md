# Rooms — Review after your updates

## ✅ What you implemented
- Soft-delete support (`isDeleted`, `deletedAt`), plus `restoreRoom` in `src/services/roomService.ts`.
- Unique `roomNumber` check on create (service-level).
- Pagination parameters in `roomService.getRooms` (accept `limit` and `startAfter`).
- Bulk operations: `bulkUpdateStatus` and `bulkDelete` implemented in `src/store/useRoomStore.ts` and UI `BulkOperations.tsx` + checkboxes in `Rooms.tsx`.
- Room detail modal implemented (`src/components/rooms/RoomDetailModal.tsx`) with placeholders for reservation listing.
- Types updated: `Room` includes `isDeleted` and `blockedDates`.

---

## ⚠️ Remaining issues / suggested fixes (priority order)

1) Pagination: `lastDoc` is never set after fetching results
- Problem: `useRoomStore.fetchRooms` passes `startAfter: lastDoc` when loading more, but `lastDoc` remains `null` because `roomService.getRooms` currently returns only `Room[]`.
- Impact: "Tải thêm" will re-query the same first page and not paginate correctly.
- Fix: change `roomService.getRooms` to return `{ rooms, lastDoc }` (or return QuerySnapshot), and update `useRoomStore.fetchRooms` to set `lastDoc` to `querySnapshot.docs[querySnapshot.docs.length - 1]`.

Snippet (service):
```ts
// return { rooms, lastDoc }
const snapshot = await getDocs(q);
const rooms = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Room));
const last = snapshot.docs[snapshot.docs.length - 1] || null;
return { rooms, lastDoc: last };
```

Snippet (store):
```ts
const { rooms, lastDoc } = await roomService.getRooms(...);
set({ rooms: [...currentRooms, ...rooms], lastDoc, hasMore: rooms.length === pageSize });
```

2) RoomDetailModal: reservations are simulated (TODO)
- Problem: modal currently sets reservations via a timeout stub. Should fetch real reservations using `reservationService.getReservations` or a dedicated `getReservationsByRoom` API.
- Fix: call reservationService.getReservations(hotelId, { roomId: room.id }) on open; show check-in/out dates and links to reservation detail.

3) Status values inconsistencies (types vs UI)
- Problem: `BulkOperations` offers statuses like `cleaning` and `out-of-order` which are not in `RoomStatus` union in `src/types/common.ts` (`'available' | 'occupied' | 'maintenance' | 'blocked'`).
- Impact: potential type mismatch and unclear status semantics.
- Fix: either restrict UI options to allowed `RoomStatus`, or expand `RoomStatus` union to include the new statuses and update any logic that depends on them.

4) Delete UX for single room delete (force option)
- Problem: single `handleDeleteRoom` currently displays a confirmation but does not offer the "force delete" fallback if the service rejects due to active reservations.
- Fix: catch the error, detect the "has reservations" message, and prompt user to confirm forced deletion (call `deleteRoom(id, true)`).

5) blockedDates is present in types but not surfaced in UI or services
- Problem: `blockedDates` exists in `Room` but there is no UI to add/view blocked ranges, and reservation availability does not consider blockedDates.
- Fix: add UI to `RoomForm` / `RoomDetailModal` to manage blocked date ranges and update `reservationService.checkAvailability` to consult blockedDates.

6) Tests & Firestore indexes/rules
- Add unit tests for `roomService` (mock Firestore) for create uniqueness, delete safety, pagination, restore.
- Ensure Firestore indexes for `hotelId + roomNumber` and `status`/`roomType` fields used in queries.
- Add security rules to prevent cross-hotel access.

7) Error handling / user messages
- Use `formatFirebaseError` for user-friendly error messages in `Rooms` page and related forms where applicable.

---

## Quick next steps I can do for you (pick one)
- A. **Fix pagination** (service + store + Rooms UI 'Tải thêm') — small, high impact.
- B. **Implement real reservations fetch** in `RoomDetailModal`.
- C. **Add forced-delete confirmation path** to `handleDeleteRoom`.
- D. **Align RoomStatus types vs UI** (decide which statuses to support).
- E. **Add blockedDates management UI and availability checks** (larger task).

Tell me which task to implement first and I'll open a PR/apply the change. ✅
