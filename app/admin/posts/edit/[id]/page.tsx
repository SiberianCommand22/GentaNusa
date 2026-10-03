import Link from "next/link";
import { redirect } from "next/navigation";
import { getEditorialSession } from "@/lib/auth";
import { fetchArticleForSession } from "@/lib/editorial-articles";
import { PostEditor } from "@/components/post-editor";
import styles from "../../../cms.module.css";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * SUNting BERITA — dijaga di sisi SERVER.
 *
 *  1. Tanpa sesi redaksi -> lempar ke rute login privat.
 *  2. Artikel milik penulis lain -> 403 "Akses Ditolak: Anda tidak memiliki
 *     izin mengedit artikel ini." (penulis lain TIDAK PERNAH melihat form).
 *  3. Administrator boleh menyunting berita siapa pun.
 *
 * Jalur form di bawah juga meminta `?scope=edit` saat memuat data, sehingga
 * pemeriksaan ini berlapis (server page + server API), bukan sekadar UI.
 */
export default async function EditPostPage({ params }: Params) {
  const { id } = await params;
  const session = await getEditorialSession();
  if (!session) {
    redirect("/admin/login/gentanusa");
  }

  const result = await fetchArticleForSession(session, id);

  if (!result.ok) {
    return (
      <div>
        <div className={styles.pageHead}>
          <div>
            <h2 className={styles.pageHeading}>Edit Berita</h2>
            <p className={styles.pageSub}>Artikel tidak dapat dibuka untuk disunting.</p>
          </div>
        </div>
        <div className={styles.guardBanner} role="alert">
          {result.error}
        </div>
        <Link href="/admin/posts" className={styles.primaryBtn}>
          Kembali ke Kelola Berita
        </Link>
      </div>
    );
  }

  return <PostEditor editId={result.article.id} />;
}