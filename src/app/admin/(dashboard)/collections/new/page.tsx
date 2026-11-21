import { CollectionForm } from "@/components/admin/collection-form";

export default function NewCollectionPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-serif text-3xl font-medium text-stone-950">
        Add Collection
      </h1>
      <p className="mt-1 text-stone-500">Create a new collection for your store.</p>
      <div className="mt-8 rounded-2xl border border-stone-200 bg-surface p-6 md:p-8">
        <CollectionForm />
      </div>
    </div>
  );
}
