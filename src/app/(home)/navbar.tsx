import { OrganizationSwitcher, UserButton } from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';
import { FaGithub } from 'react-icons/fa';

import { links } from '@/config';

import { SearchInput } from './search-input';

export const Navbar = () => {
  return (
    <nav className="flex size-full items-center justify-between">
      <Link href="/" className="mr-6 transition-opacity hover:opacity-75">
        <div className="flex shrink-0 items-center gap-3">
          <Image src="/logo.svg" alt="Docs Logo" width={36} height={36} />

          <h3 className="hidden text-2xl font-extrabold text-indigo-600 md:block">DOCS</h3>
        </div>
      </Link>

      <SearchInput />

      <div className="flex items-center gap-3 pl-6">
        <OrganizationSwitcher
          afterCreateOrganizationUrl="/"
          afterLeaveOrganizationUrl="/"
          afterSelectOrganizationUrl="/"
          afterSelectPersonalUrl="/"
        />

        <UserButton />

        <Link
          href={links.refinedSource}
          target="_blank"
          rel="noreferrer noopener"
          className="flex flex-col items-center transition-opacity hover:opacity-75"
        >
          <FaGithub className="size-6" />
          <span className="ml-2 hidden text-xs font-semibold text-gray-600 md:inline">Real Project</span>
        </Link>
        <Link
          href={links.sourceCode}
          target="_blank"
          rel="noreferrer noopener"
          className="flex flex-col items-center transition-opacity hover:opacity-75"
        >
          <FaGithub className="size-6" />
          <span className="ml-2 hidden text-xs font-semibold text-gray-600 md:inline">Refined/Improved/This Project</span>
        </Link>
      </div>
    </nav>
  );
};
