const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Insert the Error handling logic and OperationType enum
const importsInsertIndex = content.indexOf(`import { doc, setDoc, getDoc } from 'firebase/firestore';`) + `import { doc, setDoc, getDoc } from 'firebase/firestore';`.length;
const errorHandlingLogic = `
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}
interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
`;

content = content.slice(0, importsInsertIndex) + errorHandlingLogic + content.slice(importsInsertIndex);

// Update loadData
const loadSearch = `          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {`;
const loadReplace = `          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef).catch(error => handleFirestoreError(error, OperationType.GET, \`users/\${user.uid}\`));
          if (docSnap && docSnap.exists()) {`;
content = content.replace(loadSearch, loadReplace);

// Update saveData
const saveSearch = `          const docRef = doc(db, 'users', user.uid);
          await setDoc(docRef, {
            companySettings,
            products,
            contacts,
            invoices,
            transactions,
            backupSettings,
            userProfile
          });
        } catch (e) {
          console.error('Error saving data:', e);
          addToast('Error saving to Firebase', 'error');`;
const saveReplace = `          const docRef = doc(db, 'users', user.uid);
          await setDoc(docRef, {
            companySettings,
            products,
            contacts,
            invoices,
            transactions,
            backupSettings,
            userProfile
          }).catch(error => handleFirestoreError(error, OperationType.WRITE, \`users/\${user.uid}\`));
        } catch (e: any) {
          console.error('Error saving data:', e);
          const msg = e.message || 'Error saving to Firebase';
          addToast(msg.includes('Missing or insufficient permissions') ? 'Error saving to Firebase (Permissions)' : 'Error saving to Firebase', 'error');`;
content = content.replace(saveSearch, saveReplace);

fs.writeFileSync('src/App.tsx', content);
console.log("App.tsx patched for error handling");
